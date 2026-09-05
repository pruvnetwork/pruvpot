"use client";

import { useEffect, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { getConnection } from "@/lib/rpc";
import { Program, AnchorProvider } from "@coral-xyz/anchor";
import IDL from "@/lib/idl/pruv_lottery.json";
import { PROGRAM_ID, getConfigPDA, u64LE } from "@/lib/lottery-client";

const REFRESH_MS = 30_000;

// Ticket discriminator from IDL
const TICKET_DISC = Buffer.from([41, 228, 24, 165, 78, 90, 235, 200]);

export type TicketStatus = "active" | "won" | "lost";

export interface MyTicket {
  roundId: bigint;
  ticketIndex: bigint;
  status: TicketStatus;
  prizeWonLamports: bigint;
}

export interface MyTicketsState {
  tickets: MyTicket[];
  totalSpentLamports: bigint;
  totalWonLamports: bigint;
  ticketPriceLamports: bigint;
  currentRoundId: bigint;
  currentRoundTicketCount: bigint;
  loading: boolean;
}

const DUMMY_WALLET = {
  publicKey: PublicKey.default,
  signTransaction: async <T>(tx: T) => tx,
  signAllTransactions: async <T>(txs: T[]) => txs,
};

export function useMyTickets(walletAddress: string | null): MyTicketsState {
  const [state, setState] = useState<MyTicketsState>({
    tickets: [],
    totalSpentLamports: 0n,
    totalWonLamports: 0n,
    ticketPriceLamports: 0n,
    currentRoundId: 0n,
    currentRoundTicketCount: 0n,
    loading: true,
  });

  useEffect(() => {
    if (!walletAddress) {
      setState(prev => ({ ...prev, loading: false }));
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        const conn = getConnection();
        const provider = new AnchorProvider(conn, DUMMY_WALLET as never, { commitment: "confirmed" });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const program = new Program(IDL as any, provider);

        // Config: ticket price, current round id
        const [configPDA] = getConfigPDA();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const cfg: any = await (program.account as any).lotteryConfig.fetch(configPDA);
        const ticketPriceLamports = BigInt(cfg.ticketPriceLamports.toString());
        const currentRoundId = BigInt(cfg.currentRoundId.toString());

        // Current round info (ticket count for probability)
        let currentRoundTicketCount = 0n;
        if (currentRoundId > 0n) {
          const [statePDA] = PublicKey.findProgramAddressSync(
            [Buffer.from("lottery"), u64LE(currentRoundId)],
            PROGRAM_ID
          );
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const s: any = await (program.account as any).lotteryState.fetch(statePDA);
            currentRoundTicketCount = BigInt(s.ticketCount.toString());
          } catch { /* round may not exist yet */ }
        }

        // Ticket accounts owned by this wallet
        // Ticket layout: discriminator(8) + round_id(8) + buyer(32) + index(8) + bump(1)
        // buyer is at offset 8+8=16 from account start → offset 16 for memcmp
        if (!walletAddress) return;
        const walletPubkey = new PublicKey(walletAddress);
        const ticketAccounts = await conn.getProgramAccounts(PROGRAM_ID, {
          filters: [
            { memcmp: { offset: 0, bytes: TICKET_DISC.toString("base64"), encoding: "base64" } },
            { memcmp: { offset: 16, bytes: walletPubkey.toBase58() } },
          ],
          dataSlice: { offset: 8, length: 49 }, // round_id(8)+buyer(32)+index(8)+bump(1)
        });

        if (ticketAccounts.length === 0) {
          if (!cancelled) setState(prev => ({
            ...prev,
            tickets: [],
            totalSpentLamports: 0n,
            totalWonLamports: 0n,
            ticketPriceLamports,
            currentRoundId,
            currentRoundTicketCount,
            loading: false,
          }));
          return;
        }

        // Parse all tickets, group by roundId
        const roundIds = new Set<bigint>();
        const parsed: Array<{ roundId: bigint; ticketIndex: bigint }> = [];

        for (const { account } of ticketAccounts) {
          const data = account.data;
          if (data.length < 48) continue;
          const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
          const roundId = view.getBigUint64(0, true);
          // buyer: bytes 8-39 (skip)
          const ticketIndex = view.getBigUint64(40, true);
          parsed.push({ roundId, ticketIndex });
          roundIds.add(roundId);
        }

        // Fetch state for each unique round
        const roundStateMap = new Map<bigint, { status: number; winner: string; ticketCount: bigint }>();
        await Promise.allSettled(
          Array.from(roundIds).map(async (rid) => {
            const [statePDA] = PublicKey.findProgramAddressSync(
              [Buffer.from("lottery"), u64LE(rid)],
              PROGRAM_ID
            );
            try {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const s: any = await (program.account as any).lotteryState.fetch(statePDA);
              roundStateMap.set(rid, {
                status: Number(s.status),
                winner: (s.winner as PublicKey).toBase58(),
                ticketCount: BigInt(s.ticketCount.toString()),
              });
            } catch { /* round may not exist */ }
          })
        );

        // Build ticket list
        const tickets: MyTicket[] = parsed.map(({ roundId, ticketIndex }) => {
          const rs = roundStateMap.get(roundId);
          let status: TicketStatus = "active";
          let prizeWonLamports = 0n;

          if (rs) {
            if (rs.status === 2) { // finalized
              if (rs.winner === walletAddress) {
                status = "won";
                const pool = rs.ticketCount * ticketPriceLamports;
                prizeWonLamports = (pool * 80n) / 100n;
              } else {
                status = "lost";
              }
            }
          }

          return { roundId, ticketIndex, status, prizeWonLamports };
        }).sort((a, b) => Number(b.roundId - a.roundId));

        const totalSpentLamports = BigInt(tickets.length) * ticketPriceLamports;
        const totalWonLamports = tickets.reduce((s, t) => s + t.prizeWonLamports, 0n);

        if (!cancelled) setState({
          tickets,
          totalSpentLamports,
          totalWonLamports,
          ticketPriceLamports,
          currentRoundId,
          currentRoundTicketCount,
          loading: false,
        });
      } catch {
        if (!cancelled) setState(prev => ({ ...prev, loading: false }));
      }
    }

    load();
    const id = setInterval(load, REFRESH_MS);
    return () => { cancelled = true; clearInterval(id); };
  }, [walletAddress]);

  return state;
}
