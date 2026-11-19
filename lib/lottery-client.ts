"use client";

import { Program, AnchorProvider, BN } from "@coral-xyz/anchor";
import { Connection, PublicKey, SystemProgram } from "@solana/web3.js";
import type { AnchorWallet } from "@solana/wallet-adapter-react";
import { getConnection } from "./rpc";
import IDL from "./idl/pruv_lottery.json";
import type { PruvLottery } from "./idl/pruv_lottery";

export const PROGRAM_ID = new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_ID ?? "Ckvfj2PVnEseErjbjFYM9LtqwvZaVLCN6m8Vii7qPddF");


// Buffer.writeBigUInt64LE is unavailable in browser polyfills — use DataView instead.
export function u64LE(n: bigint): Buffer {
  const view = new DataView(new ArrayBuffer(8));
  view.setBigUint64(0, n, true);
  return Buffer.from(view.buffer);
}

export function getLotteryProgram(wallet: AnchorWallet, connection?: Connection) {
  const conn = connection ?? getConnection();
  const provider = new AnchorProvider(conn, wallet, { commitment: "confirmed" });
  return new Program(IDL as PruvLottery, provider);
}

// PDA helpers
export function getConfigPDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([Buffer.from("lottery_config")], PROGRAM_ID);
}

export function getLotteryStatePDA(roundId: bigint): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([Buffer.from("lottery"), u64LE(roundId)], PROGRAM_ID);
}

export function getTicketPDA(roundId: bigint, ticketIndex: bigint): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("ticket"), u64LE(roundId), u64LE(ticketIndex)],
    PROGRAM_ID
  );
}

export function getWalletCountPDA(roundId: bigint, buyer: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("wallet_tickets"), u64LE(roundId), buyer.toBuffer()],
    PROGRAM_ID
  );
}

// Buy a ticket for the given round
export async function buyTicket(
  wallet: AnchorWallet,
  connection: Connection,
  roundId: bigint,
  ticketIndex: bigint
): Promise<string> {
  const program = getLotteryProgram(wallet, connection);
  const [configPDA] = getConfigPDA();
  const [lotteryStatePDA] = getLotteryStatePDA(roundId);
  const [ticketPDA] = getTicketPDA(roundId, ticketIndex);
  const [walletCountPDA] = getWalletCountPDA(roundId, wallet.publicKey);

  const sig = await program.methods
    .buyTicket(new BN(roundId.toString()), new BN(ticketIndex.toString()))
    .accounts({
      config: configPDA,
      lotteryState: lotteryStatePDA,
      ticket: ticketPDA,
      walletCount: walletCountPDA,
      buyer: wallet.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  return sig;
}

// Fetch current lottery state from chain
export async function fetchLotteryState(connection: Connection, roundId: bigint) {
  const [statePDA] = getLotteryStatePDA(roundId);
  try {
    const accountInfo = await connection.getAccountInfo(statePDA);
    return accountInfo;
  } catch {
    return null;
  }
}

// ─── Config lock + permissionless round opening ──────────────────────────────

export function getLockPDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([Buffer.from("lottery_lock")], PROGRAM_ID);
}

/** True once `lock_config` has been called (the lock PDA exists). */
export async function fetchConfigLocked(connection: Connection): Promise<boolean> {
  const [lock] = getLockPDA();
  const info = await connection.getAccountInfo(lock, "confirmed");
  return !!info && info.data.length > 0;
}

/** Irreversible: freezes ticket price, round duration, treasury, authority and node count. */
export async function lockConfig(wallet: AnchorWallet, connection: Connection): Promise<string> {
  const program = getLotteryProgram(wallet, connection);
  const [configPDA] = getConfigPDA();
  const [lock] = getLockPDA();
  return program.methods
    .lockConfig()
    .accounts({ config: configPDA, lock, authority: wallet.publicKey, systemProgram: SystemProgram.programId })
    .rpc();
}

/** Permissionless: anyone can open the next round (and pays its rent). */
export async function initializeRound(wallet: AnchorWallet, connection: Connection, nextRoundId: bigint): Promise<string> {
  const program = getLotteryProgram(wallet, connection);
  const [configPDA] = getConfigPDA();
  const [statePDA] = getLotteryStatePDA(nextRoundId);
  return program.methods
    .initializeRound(new BN(nextRoundId.toString()))
    .accounts({ config: configPDA, lotteryState: statePDA, payer: wallet.publicKey, systemProgram: SystemProgram.programId })
    .rpc();
}

// ─── Node registry (stake-backed) ─────────────────────────────────────────────

/** Mirrors MIN_NODE_STAKE_LAMPORTS in the program (0.1 SOL). */
export const MIN_NODE_STAKE_LAMPORTS = 100_000_000n;

export function getRegistryPDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([Buffer.from("node_registry")], PROGRAM_ID);
}

export function getNodeRecordPDA(operator: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([Buffer.from("node"), operator.toBuffer()], PROGRAM_ID);
}

export interface NodeRegistryInfo { active: number; totalRegistered: number }
export interface NodeRecordInfo {
  operator: string;
  stakeLamports: bigint;
  registeredSlot: bigint;
  votesCast: bigint;
  active: boolean;
}

function readProgram(connection: Connection) {
  const dummy = {
    publicKey: PublicKey.default,
    signTransaction: async <T,>(tx: T) => tx,
    signAllTransactions: async <T,>(txs: T[]) => txs,
  };
  const provider = new AnchorProvider(connection, dummy as never, { commitment: "confirmed" });
  return new Program(IDL as PruvLottery, provider);
}

/** null until the first node has registered. */
export async function fetchRegistry(connection: Connection): Promise<NodeRegistryInfo | null> {
  try {
    const [pda] = getRegistryPDA();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r: any = await (readProgram(connection).account as any).nodeRegistry.fetch(pda);
    return { active: Number(r.active), totalRegistered: Number(r.totalRegistered.toString()) };
  } catch {
    return null;
  }
}

export async function fetchNodeRecord(connection: Connection, operator: PublicKey): Promise<NodeRecordInfo | null> {
  try {
    const [pda] = getNodeRecordPDA(operator);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r: any = await (readProgram(connection).account as any).nodeRecord.fetch(pda);
    return {
      operator: (r.operator as PublicKey).toBase58(),
      stakeLamports: BigInt(r.stakeLamports.toString()),
      registeredSlot: BigInt(r.registeredSlot.toString()),
      votesCast: BigInt(r.votesCast.toString()),
      active: Boolean(r.active),
    };
  } catch {
    return null;
  }
}

/** Every registered node (NodeRecord accounts), newest first. */
export async function fetchAllNodeRecords(connection: Connection): Promise<NodeRecordInfo[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const all: any[] = await (readProgram(connection).account as any).nodeRecord.all();
  return all
    .map(({ account: r }) => ({
      operator: (r.operator as PublicKey).toBase58(),
      stakeLamports: BigInt(r.stakeLamports.toString()),
      registeredSlot: BigInt(r.registeredSlot.toString()),
      votesCast: BigInt(r.votesCast.toString()),
      active: Boolean(r.active),
    }))
    .sort((a, b) => Number(b.registeredSlot - a.registeredSlot));
}

/** Lock `stakeLamports` (≥ MIN_NODE_STAKE_LAMPORTS) and join the registry. */
export async function registerNode(wallet: AnchorWallet, connection: Connection, stakeLamports: bigint = MIN_NODE_STAKE_LAMPORTS): Promise<string> {
  const program = getLotteryProgram(wallet, connection);
  const [nodeRecord] = getNodeRecordPDA(wallet.publicKey);
  const [registry] = getRegistryPDA();
  return program.methods
    .registerNode(new BN(stakeLamports.toString()))
    .accounts({ nodeRecord, registry, nodeOperator: wallet.publicKey, systemProgram: SystemProgram.programId })
    .rpc();
}

/** Slots between request_exit and exit_node (~1 h); mirrors UNBONDING_SLOTS in pruv-lottery. */
export const UNBONDING_SLOTS = 9_000n;

export function getExitRequestPDA(operator: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([Buffer.from("exit_request"), operator.toBuffer()], PROGRAM_ID);
}

/** Slot of the operator's pending request_exit, or null if none. */
export async function fetchExitRequest(connection: Connection, operator: PublicKey): Promise<bigint | null> {
  try {
    const [pda] = getExitRequestPDA(operator);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r: any = await (readProgram(connection).account as any).exitRequest.fetch(pda);
    return BigInt(r.requestedSlot.toString());
  } catch {
    return null;
  }
}

/** Step 1 of leaving: leave the active set now; the stake unlocks after UNBONDING_SLOTS. */
export async function requestExit(wallet: AnchorWallet, connection: Connection): Promise<string> {
  const program = getLotteryProgram(wallet, connection);
  const [nodeRecord] = getNodeRecordPDA(wallet.publicKey);
  const [registry] = getRegistryPDA();
  const [exitRequest] = getExitRequestPDA(wallet.publicKey);
  return program.methods
    .requestExit()
    .accountsPartial({ nodeRecord, registry, exitRequest, nodeOperator: wallet.publicKey, systemProgram: SystemProgram.programId })
    .rpc();
}

/** Step 2 of leaving (after the unbonding period): stake and rent come back to the wallet. */
export async function exitNode(wallet: AnchorWallet, connection: Connection): Promise<string> {
  const program = getLotteryProgram(wallet, connection);
  const [nodeRecord] = getNodeRecordPDA(wallet.publicKey);
  const [registry] = getRegistryPDA();
  const [exitRequest] = getExitRequestPDA(wallet.publicKey);
  return program.methods
    .exitNode()
    .accountsPartial({ nodeRecord, registry, exitRequest, nodeOperator: wallet.publicKey })
    .rpc();
}

export interface RoundReschedulesInfo { count: number; penaltyLamports: bigint; paidLamports: bigint }

/** How often a round's draw window was missed and moved, and the penalty pot built from it. */
export async function fetchRoundReschedules(connection: Connection, roundId: bigint): Promise<RoundReschedulesInfo | null> {
  try {
    const [pda] = PublicKey.findProgramAddressSync([Buffer.from("reschedules"), u64LE(roundId)], PROGRAM_ID);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r: any = await (readProgram(connection).account as any).roundReschedules.fetch(pda);
    return {
      count: Number(r.count),
      penaltyLamports: BigInt(r.penaltyLamports.toString()),
      paidLamports: BigInt(r.paidLamports.toString()),
    };
  } catch {
    return null;
  }
}

/**
 * `getProgramAccounts` filter for finalized rounds: LotteryState.status (u8 at
 * offset 8 disc + 5×u64 = 48) equal to 2. "3" is base58 for the byte 0x02.
 * One query instead of one fetch per round id: the keeper opens a new empty
 * round every ~10 minutes, so per-id fetching grows without bound.
 */
export const CLOSED_ROUND_FILTER = { memcmp: { offset: 48, bytes: "3" } };
