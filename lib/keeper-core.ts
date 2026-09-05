/**
 * keeper-core — one round-lifecycle pass, shared by every trigger.
 *
 * Two callers drive this:
 *   - scripts/round-keeper.ts   (GitHub Actions cron)
 *   - app/api/keeper/route.ts   (Vercel Cron)
 *
 * A single pass is idempotent: it reads the current round and takes at most one
 * action, so running it twice concurrently is harmless (the second call sees the
 * new state, or the tx fails on an already-initialised PDA).
 */

import * as anchor from "@coral-xyz/anchor";
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  SYSVAR_SLOT_HASHES_PUBKEY,
  Transaction,
  VersionedTransaction,
} from "@solana/web3.js";
import IDL from "./idl/pruv_lottery.json";

/**
 * anchor.Wallet is only exported from the CJS/node build, so importing it
 * breaks the Turbopack ESM build of the API route. It is a thin keypair
 * wrapper — implement it here so both entry points resolve identically.
 */
class KeypairWallet implements anchor.Wallet {
  constructor(readonly payer: Keypair) {}

  get publicKey(): PublicKey {
    return this.payer.publicKey;
  }

  async signTransaction<T extends Transaction | VersionedTransaction>(tx: T): Promise<T> {
    if (tx instanceof VersionedTransaction) tx.sign([this.payer]);
    else tx.partialSign(this.payer);
    return tx;
  }

  async signAllTransactions<T extends Transaction | VersionedTransaction>(txs: T[]): Promise<T[]> {
    return Promise.all(txs.map(tx => this.signTransaction(tx)));
  }
}

export const PROG_ID = new PublicKey("HxoYg9RGSK4J7bbFkuUuPXiJqonKD9g5Dx6FiaBSVpob");
export const DEFAULT_RPC = "https://api.devnet.solana.com";

/** Errors that mean "try again next tick", not "the keeper is broken". */
const TRANSIENT = [
  "503", "429", "Service Unavailable", "Too Many Requests",
  "Connection rate limits", "socket hang up", "ECONNRESET", "ETIMEDOUT",
  "TransactionExpiredTimeoutError", "was not confirmed",
];

export function isTransient(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return TRANSIENT.some(t => msg.includes(t));
}

/** What the pass actually did — surfaced to the caller for logging/monitoring. */
export type KeeperAction =
  | "opened_round"
  | "already_open"
  | "cast_draw_vote"
  | "already_voted"
  | "finalized_draw"
  | "waiting"
  | "noop";

export interface KeeperResult {
  action: KeeperAction;
  roundId: string;
  status: number | null;
  tickets: string | null;
  slotsLeft: number | null;
  signature: string | null;
  logs: string[];
}

export interface KeeperOptions {
  /** base64-encoded JSON keypair array (the round authority / node operator). */
  keypairB64: string;
  rpcUrl?: string;
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

export function loadKeypair(keypairB64: string): Keypair {
  const bytes = Buffer.from(keypairB64, "base64");
  return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(bytes.toString())));
}

export function deriveWinnerIndex(slotHash: Buffer, roundId: bigint, ticketCount: bigint): bigint {
  const rid = Buffer.alloc(8); rid.writeBigUInt64LE(roundId);
  const tc  = Buffer.alloc(8); tc.writeBigUInt64LE(ticketCount);
  const acc = Buffer.alloc(8);
  for (let i = 0; i < 8; i++)
    acc[i] = slotHash[i] ^ slotHash[i+8] ^ slotHash[i+16] ^ slotHash[i+24] ^ rid[i] ^ tc[i];
  return acc.readBigUInt64LE(0) % ticketCount;
}

export function readSlotHash(data: Buffer, target: bigint): Buffer {
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

/**
 * Run one lifecycle pass. Throws on genuine failures; use `isTransient` on the
 * error to decide whether the caller should treat it as a soft failure.
 */
export async function runKeeperPass(opts: KeeperOptions): Promise<KeeperResult> {
  const logs: string[] = [];
  const log = (msg: string) => {
    const line = `[${new Date().toISOString()}] ${msg}`;
    logs.push(line);
    console.log(line);
  };

  // Retry wrapper — handles transient 503/429 from public devnet RPC
  async function withRetry<T>(fn: () => Promise<T>, attempts = 5, baseMs = 2_000): Promise<T> {
    for (let i = 0; i < attempts; i++) {
      try {
        return await fn();
      } catch (err: unknown) {
        if (isTransient(err) && i < attempts - 1) {
          const wait = baseMs * Math.pow(1.8, i);
          log(`RPC hiccup (attempt ${i + 1}/${attempts}), retrying in ${Math.round(wait / 1000)}s…`);
          await sleep(wait);
          continue;
        }
        throw err;
      }
    }
    throw new Error("unreachable");
  }

  const authority = loadKeypair(opts.keypairB64);
  log(`Node-operator: ${authority.publicKey.toBase58()}`);

  const connection = new Connection(opts.rpcUrl || DEFAULT_RPC, {
    commitment: "confirmed",
    confirmTransactionInitialTimeout: 90_000,
  });
  const wallet   = new KeypairWallet(authority);
  const provider = new anchor.AnchorProvider(connection, wallet, {
    commitment: "confirmed",
    preflightCommitment: "processed",
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const program = new anchor.Program(IDL as any, provider);

  const [configPDA] = PublicKey.findProgramAddressSync([Buffer.from("lottery_config")], PROG_ID);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cfg: any = await withRetry(() => (program.account as any).lotteryConfig.fetch(configPDA));
  const roundId  = BigInt(cfg.currentRoundId.toString());
  const treasury: PublicKey = cfg.treasury;

  log(`Round #${roundId}`);

  const roundBuf = Buffer.alloc(8); roundBuf.writeBigUInt64LE(roundId);
  const [statePDA] = PublicKey.findProgramAddressSync([Buffer.from("lottery"), roundBuf], PROG_ID);

  const openNext = async (nid: bigint): Promise<KeeperResult> => {
    const nb = Buffer.alloc(8); nb.writeBigUInt64LE(nid);
    const [ns] = PublicKey.findProgramAddressSync([Buffer.from("lottery"), nb], PROG_ID);
    const sig = await openRound(program, authority, configPDA, ns, nid, withRetry, log);
    return {
      action: sig ? "opened_round" : "already_open",
      roundId: nid.toString(),
      status: null, tickets: null, slotsLeft: null, signature: sig, logs,
    };
  };

  const stateInfo = await withRetry(() => connection.getAccountInfo(statePDA));
  if (!stateInfo) {
    log("Round not open — opening…");
    const sig = await openRound(program, authority, configPDA, statePDA, roundId, withRetry, log);
    return {
      action: sig ? "opened_round" : "already_open",
      roundId: roundId.toString(),
      status: null, tickets: null, slotsLeft: null, signature: sig, logs,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const state: any  = await withRetry(() => (program.account as any).lotteryState.fetch(statePDA));
  const status      = Number(state.status);
  const endSlot     = BigInt(state.endSlot.toString());
  const tickets     = BigInt(state.ticketCount.toString());
  const currentSlot = BigInt(await withRetry(() => connection.getSlot("confirmed")));

  log(`status=${status}  tickets=${tickets}  end=${endSlot}  now=${currentSlot}`);

  // Finalized → open next
  if (status === 2) return openNext(roundId + 1n);

  // Still running
  if (currentSlot < endSlot) {
    const slotsLeft = Number(endSlot - currentSlot);
    log(`${slotsLeft} slots left — nothing to do`);
    return {
      action: "waiting",
      roundId: roundId.toString(),
      status, tickets: tickets.toString(), slotsLeft, signature: null, logs,
    };
  }

  // Ended, no tickets → nothing to draw, roll straight into the next round
  if (tickets === 0n) {
    log("No tickets — opening next round");
    return openNext(roundId + 1n);
  }

  // Ended, needs vote
  if (status === 0) {
    const [dvPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("draw_vote"), roundBuf, authority.publicKey.toBuffer()], PROG_ID
    );
    if (await withRetry(() => connection.getAccountInfo(dvPDA))) {
      log("Already voted");
      return {
        action: "already_voted",
        roundId: roundId.toString(),
        status, tickets: tickets.toString(), slotsLeft: 0, signature: null, logs,
      };
    }

    const shInfo = await withRetry(() => connection.getAccountInfo(SYSVAR_SLOT_HASHES_PUBKEY));
    if (!shInfo) throw new Error("SlotHashes unreadable");
    const hash = readSlotHash(Buffer.from(shInfo.data), endSlot);
    const wIdx = deriveWinnerIndex(hash, roundId, tickets);
    log(`Winner index: ${wIdx}`);

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sig: string = await (program.methods as any)
        .castDrawVote(new anchor.BN(roundId.toString()), new anchor.BN(wIdx.toString()))
        .accounts({ config: configPDA, lotteryState: statePDA, drawVote: dvPDA,
          slotHashes: SYSVAR_SLOT_HASHES_PUBKEY, nodeOperator: authority.publicKey,
          systemProgram: SystemProgram.programId })
        .signers([authority]).rpc({ skipPreflight: false, maxRetries: 3 });
      log(`cast_draw_vote: ${sig}`);
      return {
        action: "cast_draw_vote",
        roundId: roundId.toString(),
        status, tickets: tickets.toString(), slotsLeft: 0, signature: sig, logs,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("TransactionExpiredTimeoutError") || msg.includes("was not confirmed")) {
        log("cast_draw_vote timeout — tx may have landed; next run will verify");
        return {
          action: "noop",
          roundId: roundId.toString(),
          status, tickets: tickets.toString(), slotsLeft: 0, signature: null, logs,
        };
      }
      throw err;
    }
  }

  // Vote cast, ready to finalize
  const wIdx = BigInt(state.committedWinnerIndex.toString());
  const ib = Buffer.alloc(8); ib.writeBigUInt64LE(wIdx);
  const [wtPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("ticket"), roundBuf, ib], PROG_ID
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ticket: any = await withRetry(() => (program.account as any).ticket.fetch(wtPDA));
  const [npPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("node_prizes"), roundBuf], PROG_ID
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sig: string = await (program.methods as any)
    .finalizeDraw(new anchor.BN(roundId.toString()))
    .accounts({ config: configPDA, lotteryState: statePDA, winnerTicket: wtPDA,
      winnerWallet: ticket.buyer, nodePrizePool: npPDA, treasury,
      caller: authority.publicKey, systemProgram: SystemProgram.programId })
    .signers([authority]).rpc({ skipPreflight: false, maxRetries: 3 });
  log(`finalize_draw: ${sig} — winner: ${ticket.buyer.toBase58()}`);

  return {
    action: "finalized_draw",
    roundId: roundId.toString(),
    status, tickets: tickets.toString(), slotsLeft: 0, signature: sig, logs,
  };
}

async function openRound(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  program: anchor.Program<any>,
  authority: Keypair,
  configPDA: PublicKey,
  statePDA: PublicKey,
  roundId: bigint,
  withRetry: <T>(fn: () => Promise<T>) => Promise<T>,
  log: (msg: string) => void,
): Promise<string | null> {
  if (await withRetry(() => program.provider.connection.getAccountInfo(statePDA))) {
    log(`Round #${roundId} already open`);
    return null;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sig: string = await (program.methods as any)
      .initializeRound(new anchor.BN(roundId.toString()))
      .accounts({ config: configPDA, lotteryState: statePDA,
        payer: authority.publicKey, systemProgram: SystemProgram.programId })
      .signers([authority]).rpc({ skipPreflight: false, maxRetries: 3 });
    log(`initialize_round #${roundId}: ${sig}`);
    return sig;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    // Timeout doesn't mean failure — the tx may have landed. Next run will confirm.
    if (msg.includes("TransactionExpiredTimeoutError") || msg.includes("was not confirmed")) {
      log("initialize_round timeout — tx may have landed; next run will verify");
      return null;
    }
    throw err;
  }
}
