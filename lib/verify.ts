"use client";

/**
 * Independent verification of a PRUVPOT round, from public chain data only.
 *
 * What a third party can check without trusting the operator or the UI:
 *   1. the slot hash the program committed for the round (LotteryState.slot_hash_used)
 *   2. that this hash is the real SlotHashes entry for `end_slot` — directly while the
 *      slot is still inside the sysvar's window (~512 slots), otherwise by the fact that
 *      `cast_draw_vote` re-derives the index from the sysvar on-chain and rejects any
 *      disagreement (the vote transaction is public)
 *   3. that `derive_winner_index(slot_hash, round_id, ticket_count)` equals the committed index
 *   4. that the Ticket PDA at that index belongs to the wallet recorded as the winner
 *
 * The derivation below is a line-for-line mirror of the on-chain function.
 */

import { Connection, PublicKey, SYSVAR_SLOT_HASHES_PUBKEY } from "@solana/web3.js";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import IDL from "./idl/pruv_lottery.json";
import { getLotteryStatePDA, getTicketPDA, u64LE, fetchRegistry } from "./lottery-client";

/** Mirror of the program's `derive_winner_index` (full 64-bit arithmetic). */
export function deriveWinnerIndex(slotHash: Uint8Array, roundId: bigint, ticketCount: bigint): bigint {
  if (ticketCount <= 0n) throw new Error("ticketCount must be > 0");
  const rid = u64LE(roundId);
  const tc = u64LE(ticketCount);
  const acc = new Uint8Array(8);
  for (let i = 0; i < 8; i++) {
    acc[i] = slotHash[i] ^ slotHash[i + 8] ^ slotHash[i + 16] ^ slotHash[i + 24] ^ rid[i] ^ tc[i];
  }
  const v = new DataView(acc.buffer).getBigUint64(0, true);
  return v % ticketCount;
}

/** Parse the SlotHashes sysvar: [u64 count] then `count` × ([u64 slot][32-byte hash]), newest first. */
export function parseSlotHashes(data: Uint8Array): { slot: bigint; hash: Uint8Array }[] {
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const count = Number(view.getBigUint64(0, true));
  const out: { slot: bigint; hash: Uint8Array }[] = [];
  for (let i = 0; i < count; i++) {
    const off = 8 + i * 40;
    if (off + 40 > data.byteLength) break;
    out.push({ slot: view.getBigUint64(off, true), hash: data.slice(off + 8, off + 40) });
  }
  return out;
}

export async function fetchSlotHashFromSysvar(conn: Connection, slot: bigint): Promise<Uint8Array | null> {
  const info = await conn.getAccountInfo(SYSVAR_SLOT_HASHES_PUBKEY, "confirmed");
  if (!info) return null;
  const entry = parseSlotHashes(info.data).find((e) => e.slot === slot);
  return entry ? entry.hash : null;
}

import { utils } from "@coral-xyz/anchor";
const bs58 = (b: Buffer) => utils.bytes.bs58.encode(b);

export const toHex = (b: Uint8Array | number[]) =>
  Array.from(b).map((x) => x.toString(16).padStart(2, "0")).join("");

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
  const storedHash = Uint8Array.from(st.slotHashUsed as number[]);
  const hashIsZero = storedHash.every((b) => b === 0);
  const winner: PublicKey = st.winner;
  const steps: VerifyStep[] = [];

  // 1. committed hash
  if (status === 0 || hashIsZero) {
    steps.push({
      title: "Slot hash committed on-chain",
      status: "pending",
      detail: `Round is still open until slot ${endSlot.toLocaleString()}; the hash is committed by the first node vote after that slot.`,
      link: { label: "round account", href: explorer(statePda.toBase58()) },
    });
    return { roundId, status, steps, verdict: "pending" };
  }
  steps.push({
    title: "Slot hash committed on-chain",
    status: "ok",
    detail: toHex(storedHash),
    link: { label: "round account", href: explorer(statePda.toBase58()) },
  });

  // 2. sysvar cross-check
  let live: Uint8Array | null = null;
  try {
    live = await fetchSlotHashFromSysvar(conn, endSlot);
  } catch {
    live = null;
  }
  if (live) {
    const same = toHex(live) === toHex(storedHash);
    steps.push({
      title: `Matches the SlotHashes sysvar entry for slot ${endSlot.toLocaleString()}`,
      status: same ? "ok" : "fail",
      detail: same ? "Read live from the sysvar just now." : `Sysvar has ${toHex(live)}.`,
    });
  } else {
    steps.push({
      title: `Sysvar entry for slot ${endSlot.toLocaleString()} no longer available`,
      status: "info",
      detail:
        "SlotHashes keeps ~512 recent slots. For older rounds the check happened on-chain: cast_draw_vote re-derives the index from the sysvar and rejects a vote that disagrees, so the committed hash is the one Solana produced. The vote transactions are listed on the round account.",
      link: { label: "transactions", href: explorer(statePda.toBase58()) },
    });
  }

  // 3. recompute index
  if (ticketCount === 0n) {
    steps.push({ title: "Winner index recomputed", status: "info", detail: "No tickets were sold in this round." });
    return { roundId, status, steps, verdict: "verified" };
  }
  const derived = deriveWinnerIndex(storedHash, roundId, ticketCount);
  const idxOk = derived === committedIdx;
  steps.push({
    title: "Winner index recomputed from (slot hash, round id, ticket count)",
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
    const [registry, voteAccs] = await Promise.all([
      fetchRegistry(conn),
      conn.getProgramAccounts(program.programId, {
        filters: [
          { memcmp: { offset: 8, bytes: bs58(u64LE(roundId)) } },
          { dataSize: 8 + 8 + 32 + 8 + 32 + 1 + 1 }, // DrawVote
        ],
        dataSlice: { offset: 0, length: 0 },
      }),
    ]);
    const active = registry?.active ?? 0;
    const needed = Math.ceil((active * 6667) / 10_000);
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
