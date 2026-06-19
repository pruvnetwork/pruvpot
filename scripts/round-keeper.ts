/**
 * round-keeper — single-pass round lifecycle check.
 * Run every 5 minutes via GitHub Actions cron.
 *
 * Env:
 *   SOLANA_KEYPAIR   base64-encoded JSON keypair array
 *   RPC_URL          (optional, defaults to devnet)
 */

import * as anchor from "@coral-xyz/anchor";
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  SYSVAR_SLOT_HASHES_PUBKEY,
} from "@solana/web3.js";
import IDL from "../lib/idl/pruv_lottery.json";

const RPC      = process.env.RPC_URL || "https://api.devnet.solana.com";
const PROG_ID  = new PublicKey("HxoYg9RGSK4J7bbFkuUuPXiJqonKD9g5Dx6FiaBSVpob");

function log(msg: string) { console.log(`[${new Date().toISOString()}] ${msg}`); }

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

// Retry wrapper — handles transient 503/429 from public devnet RPC
async function withRetry<T>(fn: () => Promise<T>, attempts = 8, baseMs = 3_000): Promise<T> {
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const transient = ["503", "429", "Service Unavailable", "Too Many Requests",
        "Connection rate limits", "socket hang up", "ECONNRESET", "ETIMEDOUT"];
      if (transient.some(t => msg.includes(t)) && i < attempts - 1) {
        const wait = baseMs * Math.pow(1.8, i);
        log(`⚠️  RPC hiccup (attempt ${i+1}/${attempts}), retrying in ${Math.round(wait/1000)}s…`);
        await sleep(wait);
        continue;
      }
      throw err;
    }
  }
  throw new Error("unreachable");
}

function deriveWinnerIndex(slotHash: Buffer, roundId: bigint, ticketCount: bigint): bigint {
  const rid = Buffer.alloc(8); rid.writeBigUInt64LE(roundId);
  const tc  = Buffer.alloc(8); tc.writeBigUInt64LE(ticketCount);
  const acc = Buffer.alloc(8);
  for (let i = 0; i < 8; i++)
    acc[i] = slotHash[i] ^ slotHash[i+8] ^ slotHash[i+16] ^ slotHash[i+24] ^ rid[i] ^ tc[i];
  return acc.readBigUInt64LE(0) % ticketCount;
}

function readSlotHash(data: Buffer, target: bigint): Buffer {
  const count = Number(data.readBigUInt64LE(0));
  let fallback: Buffer | null = null;
  for (let i = 0; i < count; i++) {
    const off  = 8 + i * 40;
    const slot = data.readBigUInt64LE(off);
    const hash = data.subarray(off + 8, off + 40);
    if (slot === target) return Buffer.from(hash);
    if (!fallback) fallback = Buffer.from(hash);
  }
  if (!fallback) throw new Error("SlotHashes empty");
  return fallback;
}

async function main() {
  // Load keypair from env (base64-encoded JSON array)
  const raw = process.env.SOLANA_KEYPAIR;
  if (!raw) throw new Error("SOLANA_KEYPAIR env not set");
  const bytes = Buffer.from(raw, "base64");
  const authority = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(bytes.toString())));

  log(`Node-operator: ${authority.publicKey.toBase58()}`);

  const connection = new Connection(RPC, {
    commitment: "confirmed",
    confirmTransactionInitialTimeout: 90_000, // 90s instead of 30s default
  });
  const wallet     = new anchor.Wallet(authority);
  const provider   = new anchor.AnchorProvider(connection, wallet, {
    commitment: "confirmed",
    preflightCommitment: "processed",
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const program    = new anchor.Program(IDL as any, provider);

  const [configPDA] = PublicKey.findProgramAddressSync([Buffer.from("lottery_config")], PROG_ID);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cfg: any  = await withRetry(() => (program.account as any).lotteryConfig.fetch(configPDA));
  const roundId   = BigInt(cfg.currentRoundId.toString());
  const treasury: PublicKey = cfg.treasury;

  log(`Round #${roundId}`);

  const roundBuf = Buffer.alloc(8); roundBuf.writeBigUInt64LE(roundId);
  const [statePDA] = PublicKey.findProgramAddressSync([Buffer.from("lottery"), roundBuf], PROG_ID);

  const stateInfo = await withRetry(() => connection.getAccountInfo(statePDA));
  if (!stateInfo) {
    log("Round not open — opening...");
    await openRound(program, authority, configPDA, statePDA, roundId);
    return;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const state: any = await withRetry(() => (program.account as any).lotteryState.fetch(statePDA));
  const status     = Number(state.status);
  const endSlot    = BigInt(state.endSlot.toString());
  const tickets    = BigInt(state.ticketCount.toString());
  const currentSlot = BigInt(await withRetry(() => connection.getSlot("confirmed")));

  log(`status=${status}  tickets=${tickets}  end=${endSlot}  now=${currentSlot}`);

  // Finalized → open next
  if (status === 2) {
    const nid = roundId + 1n;
    const nb = Buffer.alloc(8); nb.writeBigUInt64LE(nid);
    const [ns] = PublicKey.findProgramAddressSync([Buffer.from("lottery"), nb], PROG_ID);
    await openRound(program, authority, configPDA, ns, nid);
    return;
  }

  // Still running
  if (currentSlot < endSlot) {
    log(`${Number(endSlot - currentSlot)} slots left — nothing to do`);
    return;
  }

  // Ended, no tickets
  if (tickets === 0n) {
    log("No tickets — opening next round");
    const nid = roundId + 1n;
    const nb = Buffer.alloc(8); nb.writeBigUInt64LE(nid);
    const [ns] = PublicKey.findProgramAddressSync([Buffer.from("lottery"), nb], PROG_ID);
    await openRound(program, authority, configPDA, ns, nid);
    return;
  }

  // Ended, needs vote
  if (status === 0) {
    const [dvPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("draw_vote"), roundBuf, authority.publicKey.toBuffer()], PROG_ID
    );
    if (await withRetry(() => connection.getAccountInfo(dvPDA))) { log("Already voted"); }
    else {
      const shInfo = await withRetry(() => connection.getAccountInfo(SYSVAR_SLOT_HASHES_PUBKEY));
      if (!shInfo) throw new Error("SlotHashes unreadable");
      const hash  = readSlotHash(Buffer.from(shInfo.data), endSlot);
      const wIdx  = deriveWinnerIndex(hash, roundId, tickets);
      log(`Winner index: ${wIdx}`);
      try {
        const sig: string = await (program.methods as any)
          .castDrawVote(new anchor.BN(roundId.toString()), new anchor.BN(wIdx.toString()))
          .accounts({ config: configPDA, lotteryState: statePDA, drawVote: dvPDA,
            slotHashes: SYSVAR_SLOT_HASHES_PUBKEY, nodeOperator: authority.publicKey,
            systemProgram: SystemProgram.programId })
          .signers([authority]).rpc({ skipPreflight: false, maxRetries: 3 });
        log(`✅ cast_draw_vote: ${sig}`);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes("TransactionExpiredTimeoutError") || msg.includes("was not confirmed")) {
          log(`⚠️  cast_draw_vote timeout — tx may have landed; next run will verify`);
          return;
        }
        throw err;
      }
    }
    return; // finalize on next run (status will be 1 after vote)
  }

  // Vote cast, ready to finalize
  if (status === 1) {
    const wIdx = BigInt(state.committedWinnerIndex.toString());
    const ib = Buffer.alloc(8); ib.writeBigUInt64LE(wIdx);
    const [wtPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("ticket"), roundBuf, ib], PROG_ID
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ticket: any = await withRetry(() => (program.account as any).ticket.fetch(wtPDA));
    const [npPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("node_prizes"), roundBuf], PROG_ID
    );
    const sig: string = await (program.methods as any)
      .finalizeDraw(new anchor.BN(roundId.toString()))
      .accounts({ config: configPDA, lotteryState: statePDA, winnerTicket: wtPDA,
        winnerWallet: ticket.buyer, nodePrizePool: npPDA, treasury,
        caller: authority.publicKey, systemProgram: SystemProgram.programId })
      .signers([authority]).rpc({ skipPreflight: false, maxRetries: 3 });
    log(`✅ finalize_draw: ${sig} — winner: ${ticket.buyer.toBase58()}`);
  }
}

async function openRound(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  program: anchor.Program<any>,
  authority: Keypair,
  configPDA: PublicKey,
  statePDA: PublicKey,
  roundId: bigint,
) {
  if (await withRetry(() => program.provider.connection.getAccountInfo(statePDA))) {
    log(`Round #${roundId} already open`);
    return;
  }
  try {
    const sig: string = await (program.methods as any)
      .initializeRound(new anchor.BN(roundId.toString()))
      .accounts({ config: configPDA, lotteryState: statePDA,
        payer: authority.publicKey, systemProgram: SystemProgram.programId })
      .signers([authority]).rpc({ skipPreflight: false, maxRetries: 3 });
    log(`✅ initialize_round #${roundId}: ${sig}`);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    // Timeout doesn't mean failure — the tx may have landed. Next run will confirm.
    if (msg.includes("TransactionExpiredTimeoutError") || msg.includes("was not confirmed")) {
      log(`⚠️  initialize_round timeout — tx may have landed; next run will verify`);
      return;
    }
    throw err;
  }
}

main().catch(err => {
  const msg = err instanceof Error ? err.message : String(err);
  // Transient RPC errors — don't fail the CI run, retry on next cron tick
  const transient = ["503", "429", "Service Unavailable", "Too Many Requests",
    "Connection rate limits", "TransactionExpiredTimeoutError", "was not confirmed"];
  if (transient.some(t => msg.includes(t))) {
    log(`⚠️  Transient RPC error (will retry next run): ${msg.slice(0, 120)}`);
    process.exit(0);
  }
  log(`Fatal: ${err}`);
  process.exit(1);
});
