"use client";

import { useEffect, useState } from "react";
import { Connection, PublicKey } from "@solana/web3.js";
import { Program, AnchorProvider } from "@coral-xyz/anchor";
import IDL from "@/lib/idl/pruv_lottery.json";
import { PROGRAM_ID, getConfigPDA, u64LE } from "@/lib/lottery-client";
import type { RoundHistory } from "@/lib/types";

const RPC = process.env.NEXT_PUBLIC_RPC_URL ?? "https://api.devnet.solana.com";
const REFRESH_MS = 30_000;

const DUMMY_WALLET = {
  publicKey: PublicKey.default,
  signTransaction: async <T>(tx: T) => tx,
  signAllTransactions: async <T>(txs: T[]) => txs,
};

export interface RoundHistoryState {
  history: RoundHistory[];
  totalPaidLamports: bigint;
  loading: boolean;
}

export function useRoundHistory(): RoundHistoryState {
  const [state, setState] = useState<RoundHistoryState>({
    history: [],
    totalPaidLamports: 0n,
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;

    async function fetch() {
      try {
        const conn = new Connection(RPC, "confirmed");
        const provider = new AnchorProvider(conn, DUMMY_WALLET as never, { commitment: "confirmed" });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const program = new Program(IDL as any, provider);

        // Get current round count from config
        const [configPDA] = getConfigPDA();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const cfg = await (program.account as any).lotteryConfig.fetch(configPDA);
        const currentRoundId = Number(cfg.currentRoundId.toString());
        // ticket_price_lamports from config — used to reconstruct prize pool for finalized rounds
        // (program zeros prize_pool_lamports after finalization)
        const ticketPriceLamports = BigInt(cfg.ticketPriceLamports.toString());

        if (currentRoundId === 0) {
          if (!cancelled) setState({ history: [], totalPaidLamports: 0n, loading: false });
          return;
        }

        // Fetch all rounds in parallel
        const roundIds = Array.from({ length: currentRoundId }, (_, i) => i + 1);
        const results = await Promise.allSettled(
          roundIds.map(async (id) => {
            const idBig = BigInt(id);
            const [statePDA] = PublicKey.findProgramAddressSync(
              [Buffer.from("lottery"), u64LE(idBig)],
              PROGRAM_ID
            );
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return (program.account as any).lotteryState.fetch(statePDA);
          })
        );

        const history: RoundHistory[] = [];
        let totalPaidLamports = 0n;

        for (let i = 0; i < results.length; i++) {
          const r = results[i];
          if (r.status !== "fulfilled") continue;
          const s = r.value;
          if (Number(s.status) !== 2) continue; // only finalized

          const ticketCount = BigInt(s.ticketCount.toString());
          const winnerKey: PublicKey = s.winner;
          const isZero = winnerKey.equals(PublicKey.default);

          // After finalization the program zeros prize_pool_lamports on-chain,
          // so reconstruct it from ticketCount × ticketPrice.
          const prizePoolLamports = ticketCount * ticketPriceLamports;

          history.push({
            roundId: BigInt(s.roundId.toString()),
            winner: isZero ? "—" : winnerKey.toBase58(),
            prizePoolLamports,
            ticketCount,
            closedAt: 0,
            txSig: "",
          });

          totalPaidLamports += (prizePoolLamports * 80n) / 100n;
        }

        // Most recent first
        history.sort((a, b) => Number(b.roundId - a.roundId));

        if (!cancelled) setState({ history, totalPaidLamports, loading: false });
      } catch {
        if (!cancelled) setState(prev => ({ ...prev, loading: false }));
      }
    }

    fetch();
    const id = setInterval(fetch, REFRESH_MS);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  return state;
}
