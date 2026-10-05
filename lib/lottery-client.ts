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
