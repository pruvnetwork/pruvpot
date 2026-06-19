"use client";

import { Program, AnchorProvider, BN } from "@coral-xyz/anchor";
import { Connection, PublicKey, SystemProgram } from "@solana/web3.js";
import type { AnchorWallet } from "@solana/wallet-adapter-react";
import IDL from "./idl/pruv_lottery.json";
import type { PruvLottery } from "./idl/pruv_lottery";

export const PROGRAM_ID = new PublicKey("HxoYg9RGSK4J7bbFkuUuPXiJqonKD9g5Dx6FiaBSVpob");
const DEVNET_RPC = process.env.NEXT_PUBLIC_RPC_URL ?? "https://api.devnet.solana.com";

export function getLotteryProgram(wallet: AnchorWallet, connection?: Connection) {
  const conn = connection ?? new Connection(DEVNET_RPC, "confirmed");
  const provider = new AnchorProvider(conn, wallet, { commitment: "confirmed" });
  return new Program(IDL as PruvLottery, provider);
}

// PDA helpers
export function getConfigPDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([Buffer.from("config")], PROGRAM_ID);
}

export function getLotteryStatePDA(roundId: bigint): [PublicKey, number] {
  const roundBuf = Buffer.alloc(8);
  roundBuf.writeBigUInt64LE(roundId);
  return PublicKey.findProgramAddressSync([Buffer.from("lottery_state"), roundBuf], PROGRAM_ID);
}

export function getTicketPDA(roundId: bigint, ticketIndex: bigint): [PublicKey, number] {
  const roundBuf = Buffer.alloc(8);
  roundBuf.writeBigUInt64LE(roundId);
  const idxBuf = Buffer.alloc(8);
  idxBuf.writeBigUInt64LE(ticketIndex);
  return PublicKey.findProgramAddressSync(
    [Buffer.from("ticket"), roundBuf, idxBuf],
    PROGRAM_ID
  );
}

export function getWalletCountPDA(roundId: bigint, buyer: PublicKey): [PublicKey, number] {
  const roundBuf = Buffer.alloc(8);
  roundBuf.writeBigUInt64LE(roundId);
  return PublicKey.findProgramAddressSync(
    [Buffer.from("wallet_count"), roundBuf, buyer.toBuffer()],
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
