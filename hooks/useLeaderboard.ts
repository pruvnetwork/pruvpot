"use client";

import { useEffect, useState } from "react";
import { Connection, PublicKey } from "@solana/web3.js";
import { Program, AnchorProvider } from "@coral-xyz/anchor";
import IDL from "@/lib/idl/pruv_lottery.json";
import { PROGRAM_ID, getConfigPDA, u64LE } from "@/lib/lottery-client";

const RPC = process.env.NEXT_PUBLIC_RPC_URL ?? "https://api.devnet.solana.com";
const REFRESH_MS = 60_000;

// Ticket discriminator from IDL
const TICKET_DISC = Buffer.from([41, 228, 24, 165, 78, 90, 235, 200]);

export interface LeaderEntry {
  wallet: string;
  totalTickets: number;
  totalSpentLamports: bigint;
  totalWonLamports: bigint;
  wins: number;
}

export interface LeaderboardState {
  entries: LeaderEntry[];
  loading: boolean;
}

const DUMMY_WALLET = {
  publicKey: PublicKey.default,
  signTransaction: async <T>(tx: T) => tx,
  signAllTransactions: async <T>(txs: T[]) => txs,
};

export function useLeaderboard(): LeaderboardState {
  const [state, setState] = useState<LeaderboardState>({ entries: [], loading: true });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const conn = new Connection(RPC, "confirmed");
        const provider = new AnchorProvider(conn, DUMMY_WALLET as never, { commitment: "confirmed" });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const program = new Program(IDL as any, provider);

        // Fetch config for ticket price and current round id
        const [configPDA] = getConfigPDA();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const cfg: any = await (program.account as any).lotteryConfig.fetch(configPDA);
        const ticketPriceLamports = BigInt(cfg.ticketPriceLamports.toString());
        const currentRoundId = Number(cfg.currentRoundId.toString());

        // Fetch all ticket accounts by discriminator
        const ticketAccounts = await conn.getProgramAccounts(PROGRAM_ID, {
          filters: [{ memcmp: { offset: 0, bytes: TICKET_DISC.toString("base64"), encoding: "base64" } }],
          dataSlice: { offset: 8, length: 48 }, // round_id(8) + buyer(32) + index(8)
        });

        // Aggregate per wallet: tickets count, spent
        const walletMap = new Map<string, { tickets: number; spent: bigint; wins: number; wonLamports: bigint }>();

        for (const { account } of ticketAccounts) {
          const data = account.data;
          if (data.length < 48) continue;
          // round_id: bytes 0-7, buyer: bytes 8-39, index: bytes 40-47
          const buyer = new PublicKey(data.slice(8, 40)).toBase58();
          const key = buyer;
          const existing = walletMap.get(key) ?? { tickets: 0, spent: 0n, wins: 0, wonLamports: 0n };
          walletMap.set(key, { ...existing, tickets: existing.tickets + 1, spent: existing.spent + ticketPriceLamports });
        }

        // Fetch all finalized rounds to get winner data
        if (currentRoundId > 0) {
          const roundIds = Array.from({ length: currentRoundId }, (_, i) => BigInt(i + 1));
          const results = await Promise.allSettled(
            roundIds.map(async (id) => {
              const [statePDA] = PublicKey.findProgramAddressSync(
                [Buffer.from("lottery"), u64LE(id)],
                PROGRAM_ID
              );
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              return (program.account as any).lotteryState.fetch(statePDA);
            })
          );

          for (const r of results) {
            if (r.status !== "fulfilled") continue;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const s: any = r.value;
            if (Number(s.status) !== 2) continue; // only finalized

            const winner: PublicKey = s.winner;
            if (winner.equals(PublicKey.default)) continue;

            const winnerKey = winner.toBase58();
            const ticketCount = BigInt(s.ticketCount.toString());
            const prizePool = ticketCount * ticketPriceLamports;
            const winnerShare = (prizePool * 80n) / 100n;

            const existing = walletMap.get(winnerKey) ?? { tickets: 0, spent: 0n, wins: 0, wonLamports: 0n };
            walletMap.set(winnerKey, { ...existing, wins: existing.wins + 1, wonLamports: existing.wonLamports + winnerShare });
          }
        }

        // Sort by total tickets descending
        const entries: LeaderEntry[] = Array.from(walletMap.entries())
          .map(([wallet, v]) => ({
            wallet,
            totalTickets: v.tickets,
            totalSpentLamports: v.spent,
            totalWonLamports: v.wonLamports,
            wins: v.wins,
          }))
          .filter(e => e.totalTickets > 0)
          .sort((a, b) => b.totalTickets - a.totalTickets);

        if (!cancelled) setState({ entries, loading: false });
      } catch {
        if (!cancelled) setState(prev => ({ ...prev, loading: false }));
      }
    }

    load();
    const id = setInterval(load, REFRESH_MS);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  return state;
}
