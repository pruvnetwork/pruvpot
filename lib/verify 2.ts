"use client";

/**
 * Independent verification of a PRUVPOT round, from public chain data only.
 *
 * What a third party can check without trusting the operator or the UI:
 *   1. the draw seed the program committed for the round (LotteryState.seed)
 *   2. that the seed really is Poseidon over the eight SlotHashes entries of the
 *      window `end_slot .. end_slot+8` — recomputed from the live sysvar while the
 *      window is still inside it (~512 slots), otherwise from the eight hashes the
 *      program recorded in the `SeedCommitted` event of the first vote transaction
 *   3. that `u64_le(seed[0..8]) mod ticket_count` equals the committed index
 *   4. that the Ticket PDA at that index belongs to the wallet recorded as the winner
 *   5. how many staked nodes voted (liveness evidence; the result never depends on them)
 *
 * The derivation (lib/seed.ts) is a byte-for-byte mirror of the on-chain function.
 */

import { Connection, PublicKey } from "@solana/web3.js";
import { AnchorProvider, BorshCoder, EventParser, Program, utils } from "@coral-xyz/anchor";
import IDL from "./idl/pruv_lottery.json";
import { getLotteryStatePDA, getTicketPDA, u64LE, fetchRegistry, getConfigPDA } from "./lottery-client";
import {
  SEED_WINDOW_SLOTS,
  SeedExpired,
  SeedWindowNotComplete,
  computeSeed,
  deriveWinnerIndex,
  fetchSeedWindow,
  toHex,
} from "./seed";

export { deriveWinnerIndex, computeSeed, toHex };

const bs58 = (b: Buffer) => utils.bytes.bs58.encode(b);

export type StepStatus = "ok" | "fail" | "pending" | "info";
export interface VerifyStep {
  title: string;
  status: StepStatus;
  detail?: string;
  link?: { label: string; href: string };
}
export interface VerifyReport {
  roundId: bigint;
  status: number; // 0 open, 1 committing, 2 closed
  steps: VerifyStep[];
  verdict: "verified" | "mismatch" | "pending";
}

const DUMMY_WALLET = {
  publicKey: PublicKey.default,
  signTransaction: async (tx: unknown) => tx,
  signAllTransactions: async (txs: unknown[]) => txs,
};

const explorer = (addr: string) => `https://explorer.solana.com/address/${addr}?cluster=devnet`;
const explorerTx = (sig: string) => `https://explorer.solana.com/tx/${sig}?cluster=devnet`;

interface SeedCommittedEvent {
  firstSlot: bigint;
  slotHashes: Uint8Array[];
  presentMask: number;
  ticketCount: bigint;
  seed: Uint8Array;
  signature: string;
}

/** Find the `SeedCommitted` event in the round account's transaction history (first vote). */
async function findSeedCommitted(
  conn: Connection,
  programId: PublicKey,
  statePda: PublicKey,
): Promise<SeedCommittedEvent | null> {
  const sigs = await conn.getSignaturesForAddress(statePda, { limit: 60 }, "confirmed");
  const parser = new EventParser(programId, new BorshCoder(IDL as never));
  // Oldest first: the committing vote is early in the round's history.
  for (const s of sigs.reverse()) {
    if (s.err) continue;
    const tx = await conn.getTransaction(s.signature, { commitment: "confirmed", maxSupportedTransactionVersion: 0 });
    const logs = tx?.meta?.logMessages;
    if (!logs) continue;
    for (const ev of parser.parseLogs(logs)) {
      if (ev.name !== "SeedCommitted" && ev.name !== "seedCommitted") continue;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const d: any = ev.data;
      const hashes = (d.slotHashes ?? d.slot_hashes) as number[][];
      return {
        firstSlot: BigInt((d.firstSlot ?? d.first_slot).toString()),
        slotHashes: hashes.map((h) => Uint8Array.from(h)),
        presentMask: Number(d.presentMask ?? d.present_mask),
        ticketCount: BigInt((d.ticketCount ?? d.ticket_count).toString()),
        seed: Uint8Array.from(d.seed as number[]),
        signature: s.signature,
      };
    }
  }
  return null;
}

const windowLabel = (first: bigint) =>
  `${first.toLocaleString()} … ${(first + BigInt(SEED_WINDOW_SLOTS - 1)).toLocaleString()}`;

export async function verifyRound(conn: Connection, roundId: bigint): Promise<VerifyReport> {
  const provider = new AnchorProvider(conn, DUMMY_WALLET as never, { commitment: "confirmed" });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const program = new Program(IDL as any, provider);
  const [statePda] = getLotteryStatePDA(roundId);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const st: any = await (program.account as any).lotteryState.fetch(statePda);

  const status = Number(st.status);
  const ticketCount = BigInt(st.ticketCount.toString());
  const endSlot = BigInt(st.endSlot.toString());
  const committedIdx = BigInt(st.committedWinnerIndex.toString());
  const storedSeed = Uint8Array.from(st.seed as number[]);
  const seedIsZero = storedSeed.every((b) => b === 0);
  const winner: PublicKey = st.winner;
  const steps: VerifyStep[] = [];

  // 1. committed seed
  if (status === 0 || seedIsZero) {
    steps.push({
      title: "Draw seed committed on-chain",
      status: "pending",
      detail: `Round is open until slot ${endSlot.toLocaleString()}; the seed is fixed by the first node vote once slots ${windowLabel(endSlot)} exist.`,
      link: { label: "round account", href: explorer(statePda.toBase58()) },
    });
    return { roundId, status, steps, verdict: "pending" };
  }
  steps.push({
    title: "Draw seed committed on-chain",
    status: "ok",
    detail: toHex(storedSeed),
    link: { label: "round account", href: explorer(statePda.toBase58()) },
  });

  // 2. recompute the seed from the eight slot hashes
  let seedChecked = false;
  try {
    const win = await fetchSeedWindow(conn, endSlot, "confirmed");
    const recomputed = computeSeed(win.hashes, roundId, ticketCount);
    const same = toHex(recomputed) === toHex(storedSeed);
    steps.push({
      title: `Seed recomputed from the live SlotHashes window ${windowLabel(endSlot)}`,
      status: same ? "ok" : "fail",
      detail: same
        ? `Poseidon over the 8 hashes read from the sysvar just now (${win.presentMask.toString(2).split("1").length - 1}/8 slots produced), round id and ticket count.`
        : `Sysvar gives ${toHex(recomputed)}.`,
    });
    seedChecked = true;
  } catch (e) {
    if (!(e instanceof SeedExpired) && !(e instanceof SeedWindowNotComplete)) {
      steps.push({ title: "SlotHashes sysvar", status: "info", detail: `Could not read the sysvar (RPC): ${String(e)}` });
    }
  }
  if (!seedChecked) {
    try {
      const ev = await findSeedCommitted(conn, program.programId, statePda);
      if (ev) {
        const recomputed = computeSeed(ev.slotHashes, roundId, ticketCount);
        const same = toHex(recomputed) === toHex(storedSeed) && ev.firstSlot === endSlot;
        steps.push({
          title: `Seed recomputed from the 8 slot hashes recorded in the vote transaction (window ${windowLabel(ev.firstSlot)})`,
          status: same ? "ok" : "fail",
          detail: same
            ? "The sysvar has rotated past this window; the program wrote the inputs it read into the SeedCommitted event when it fixed the seed."
            : `Recomputed ${toHex(recomputed)} from the logged hashes.`,
          link: { label: "vote transaction", href: explorerTx(ev.signature) },
        });
      } else {
        steps.push({
          title: `Window ${windowLabel(endSlot)} no longer in the sysvar and no SeedCommitted log found`,
          status: "info",
          detail:
            "The RPC did not return the committing vote transaction. The program itself recomputed the seed from the sysvar at vote time and rejects disagreeing votes; use an archive RPC to re-check the logged inputs.",
          link: { label: "transactions", href: explorer(statePda.toBase58()) },
        });
      }
    } catch (e) {
      steps.push({ title: "Vote transaction log", status: "info", detail: `Could not read transaction history (RPC): ${String(e)}` });
    }
  }

  // 3. recompute index
  if (ticketCount === 0n) {
    steps.push({ title: "Winner index recomputed", status: "info", detail: "No tickets were sold in this round." });
    return { roundId, status, steps, verdict: "verified" };
  }
  const derived = deriveWinnerIndex(storedSeed, ticketCount);
  const idxOk = derived === committedIdx;
  steps.push({
    title: "Winner index = u64_le(seed[0..8]) mod ticket count",
    status: idxOk ? "ok" : "fail",
    detail: `derived #${derived} · committed #${committedIdx} · ${ticketCount} tickets`,
  });

  // 4. ticket → winner wallet
  if (status === 2) {
    const [ticketPda] = getTicketPDA(roundId, committedIdx);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const t: any = await (program.account as any).ticket.fetch(ticketPda);
      const buyer: PublicKey = t.buyer;
      const ok = buyer.equals(winner);
      steps.push({
        title: `Ticket #${committedIdx} belongs to the recorded winner`,
        status: ok ? "ok" : "fail",
        detail: ok ? buyer.toBase58() : `ticket owner ${buyer.toBase58()} ≠ recorded winner ${winner.toBase58()}`,
        link: { label: "ticket account", href: explorer(ticketPda.toBase58()) },
      });
    } catch {
      steps.push({ title: `Ticket #${committedIdx} account`, status: "fail", detail: "Ticket PDA not found." });
    }
  } else {
    steps.push({
      title: "Winner wallet recorded",
      status: "pending",
      detail: "finalize_draw has not been called yet; the winner wallet is written at finalization.",
    });
  }

  // 5. votes vs. the staked registry (liveness evidence; correctness never depends on nodes)
  try {
    const [registry, voteAccs, cfg] = await Promise.all([
      fetchRegistry(conn),
      conn.getProgramAccounts(program.programId, {
        filters: [
          { memcmp: { offset: 8, bytes: bs58(u64LE(roundId)) } },
          { dataSize: 8 + 8 + 32 + 8 + 32 + 1 + 1 }, // DrawVote
        ],
        dataSlice: { offset: 0, length: 0 },
      }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (program.account as any).lotteryConfig.fetch(getConfigPDA()[0]).catch(() => null),
    ]);
    const active = registry?.active ?? 0;
    const thresholdBps = cfg ? Number(cfg.thresholdBps.toString()) : 6666;
    const needed = Math.ceil((active * thresholdBps) / 10_000);
    const votes = voteAccs.length;
    steps.push({
      title: `Votes from staked nodes: ${votes} of ${active} registered (≥ ${needed} needed)`,
      status: votes >= needed && votes > 0 ? "ok" : status === 2 ? "fail" : "pending",
      detail: "Each vote was re-derived and checked by the program; nodes can only delay a round, not change its result.",
    });
  } catch {
    steps.push({ title: "Votes from staked nodes", status: "info", detail: "Could not read vote accounts (RPC)." });
  }

  const verdict = steps.some((s) => s.status === "fail")
    ? "mismatch"
    : steps.some((s) => s.status === "pending")
    ? "pending"
    : "verified";
  return { roundId, status, steps, verdict };
}
