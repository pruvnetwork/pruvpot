"use client";

import { useEffect, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { getConnection } from "@/lib/rpc";
import { AnchorProvider, Program, utils } from "@coral-xyz/anchor";
import IDL from "@/lib/idl/pruv_lottery.json";
import { PROGRAM_ID, getConfigPDA, getLotteryStatePDA, u64LE } from "@/lib/lottery-client";

const TICKET_DISC = Buffer.from([41, 228, 24, 165, 78, 90, 235, 200]);
const DUMMY_WALLET = {
  publicKey: PublicKey.default,
  signTransaction: async (tx: unknown) => tx,
  signAllTransactions: async (txs: unknown[]) => txs,
};

export interface ProfileRound {
  roundId: bigint;
  tickets: number;
  result: "active" | "won" | "lost";
  prizePoolLamports: bigint;
  prizeWonLamports: bigint;
  closedAtSlot: bigint;
}

export interface WalletProfile {
  wallet: string;
  totalTickets: number;
  totalSpentLamports: bigint;
  totalWonLamports: bigint;
  ticketPriceLamports: bigint;
  wins: number;
  winRate: number;
  firstSeenRound: bigint;
  rounds: ProfileRound[];
}

export interface WalletProfileState {
  profile: WalletProfile | null;
  loading: boolean;
  notFound: boolean;
}

export function useWalletProfile(walletAddress: string | null): WalletProfileState {
  const [state, setState] = useState<WalletProfileState>({ profile: null, loading: true, notFound: false });

  useEffect(() => {
    if (!walletAddress) { setState({ profile: null, loading: false, notFound: true }); return; }

    let pubkey: PublicKey;
    try { pubkey = new PublicKey(walletAddress); }
    catch { setState({ profile: null, loading: false, notFound: true }); return; }

    let cancelled = false;

    async function load() {
      try {
        const conn = getConnection();
        const provider = new AnchorProvider(conn, DUMMY_WALLET as never, { commitment: "confirmed" });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const program = new Program(IDL as any, provider);

        // Config for ticket price
        const [configPDA] = getConfigPDA();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const cfg: any = await (program.account as any).lotteryConfig.fetch(configPDA);
        const ticketPriceLamports = BigInt(cfg.ticketPriceLamports.toString());

        // All tickets for this wallet
        const ticketAccs = await conn.getProgramAccounts(PROGRAM_ID, {
          filters: [
            { memcmp: { offset: 0, bytes: utils.bytes.bs58.encode(TICKET_DISC) } },
            { memcmp: { offset: 16, bytes: pubkey.toBase58() } },
          ],
          dataSlice: { offset: 8, length: 48 },
        });

        if (ticketAccs.length === 0) {
          if (!cancelled) setState({ profile: null, loading: false, notFound: true });
          return;
        }

        // Group by roundId
        const byRound = new Map<string, number>();
        for (const { account } of ticketAccs) {
          const roundId = new DataView(account.data.buffer, account.data.byteOffset).getBigUint64(0, true);
          const key = roundId.toString();
          byRound.set(key, (byRound.get(key) ?? 0) + 1);
        }

        const roundIds = [...byRound.keys()].map(k => BigInt(k));

        // Fetch round states in parallel
        const roundStates = await Promise.all(
          roundIds.map(async rid => {
            const [pda] = getLotteryStatePDA(rid);
            try {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const st: any = await (program.account as any).lotteryState.fetch(pda);
              return { roundId: rid, state: st };
            } catch { return { roundId: rid, state: null }; }
          })
        );

        const rounds: ProfileRound[] = roundStates.map(({ roundId, state }) => {
          const tickets = byRound.get(roundId.toString()) ?? 0;
          if (!state) {
            return { roundId, tickets, result: "lost" as const, prizePoolLamports: 0n, prizeWonLamports: 0n, closedAtSlot: 0n };
          }
          const status = Number(state.status);
          const ticketCount = BigInt(state.ticketCount.toString());
          const winnerKey: PublicKey = state.winner;
          const isWinner = !winnerKey.equals(PublicKey.default) && winnerKey.equals(pubkey);
          const prizePoolLamports = ticketCount * ticketPriceLamports;
          const winnerShare = (prizePoolLamports * 80n) / 100n;
          const prizeWonLamports = isWinner ? winnerShare : 0n;
          const result: "active" | "won" | "lost" =
            status < 2 ? "active" : isWinner ? "won" : "lost";
          const closedAtSlot = BigInt(state.endSlot.toString());
          return { roundId, tickets, result, prizePoolLamports, prizeWonLamports, closedAtSlot };
        }).sort((a, b) => Number(b.roundId - a.roundId));

        const totalTickets = ticketAccs.length;
        const totalSpentLamports = BigInt(totalTickets) * ticketPriceLamports;
        const totalWonLamports = rounds.reduce((s, r) => s + r.prizeWonLamports, 0n);
        const wins = rounds.filter(r => r.result === "won").length;
        const finalized = rounds.filter(r => r.result !== "active").length;
        const winRate = finalized > 0 ? Math.round((wins / finalized) * 100) : 0;
        const firstSeenRound = roundIds.reduce((min, id) => id < min ? id : min, roundIds[0]);

        if (!cancelled) setState({
          profile: {
            wallet: walletAddress!, totalTickets, totalSpentLamports, totalWonLamports,
            ticketPriceLamports, wins, winRate, firstSeenRound, rounds,
          },
          loading: false, notFound: false,
        });
      } catch {
        if (!cancelled) setState({ profile: null, loading: false, notFound: true });
      }
    }

    setState({ profile: null, loading: true, notFound: false });
    load();
    const id = setInterval(load, 20_000);
    return () => { cancelled = true; clearInterval(id); };
  }, [walletAddress]);

  return state;
}
