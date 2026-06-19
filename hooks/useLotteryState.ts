"use client";

import { useEffect, useRef, useState } from "react";
import { Connection, PublicKey } from "@solana/web3.js";
import { Program, AnchorProvider } from "@coral-xyz/anchor";
import IDL from "@/lib/idl/pruv_lottery.json";
import { PROGRAM_ID, getConfigPDA, getLotteryStatePDA } from "@/lib/lottery-client";
import type { LotteryRoundState } from "@/lib/types";

const RPC = process.env.NEXT_PUBLIC_RPC_URL ?? "https://api.devnet.solana.com";
// Devnet: ~400ms per slot
const MS_PER_SLOT = 400;
const POLL_INTERVAL_MS = 5_000;

// Minimal wallet stub — no signing needed for account reads
const DUMMY_WALLET = {
  publicKey: PublicKey.default,
  signTransaction: async <T>(tx: T) => tx,
  signAllTransactions: async <T>(txs: T[]) => txs,
};

function getReadProgram() {
  const conn = new Connection(RPC, "confirmed");
  const provider = new AnchorProvider(conn, DUMMY_WALLET as never, { commitment: "confirmed" });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { program: new Program(IDL as any, provider), connection: conn };
}

export interface LotteryChainState {
  round: LotteryRoundState | null;
  countdown: number;      // ms until end_slot
  currentSlot: number;
  ticketPriceLamports: bigint;
  loading: boolean;
  error: string | null;
}

export function useLotteryState(): LotteryChainState {
  const [state, setState] = useState<LotteryChainState>({
    round: null,
    countdown: 0,
    currentSlot: 0,
    ticketPriceLamports: BigInt(10_000_000),
    loading: true,
    error: null,
  });

  // Keep current slot up-to-date between polls for smooth countdown
  const slotRef = useRef(0);
  const endSlotRef = useRef(0);

  // Smooth countdown tick every 400ms (one slot)
  useEffect(() => {
    const id = setInterval(() => {
      const remaining = Math.max(0, (endSlotRef.current - slotRef.current) * MS_PER_SLOT);
      setState(prev => ({ ...prev, countdown: remaining }));
      slotRef.current += 1; // optimistic slot advance between polls
    }, MS_PER_SLOT);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function fetchChainState() {
      try {
        const { program, connection } = getReadProgram();
        const [configPDA] = getConfigPDA();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const cfg = await (program.account as any).lotteryConfig.fetch(configPDA);
        const currentRoundId: bigint = BigInt(cfg.currentRoundId.toString());
        const ticketPriceLamports: bigint = BigInt(cfg.ticketPriceLamports.toString());
        const activeNodeCount: number = Number(cfg.activeNodeCount);
        const thresholdBps: bigint = BigInt(cfg.thresholdBps.toString());

        if (currentRoundId === 0n) {
          if (!cancelled) setState(prev => ({ ...prev, loading: false, error: "No round open yet" }));
          return;
        }

        const [statePDA] = getLotteryStatePDA(currentRoundId);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const s = await (program.account as any).lotteryState.fetch(statePDA);

        const endSlot = Number(s.endSlot.toString());
        const currentSlot = await connection.getSlot("confirmed");

        // Determine status: 0=open, 1=drawing, 2=closed
        // On-chain status field: 0=Open, 1=Drawing, 2=Finalized
        const status = Number(s.status) as 0 | 1 | 2;

        const winnerKey: PublicKey = s.winner;
        const isZeroWinner = winnerKey.equals(PublicKey.default);
        const winner = isZeroWinner ? null : winnerKey.toBase58();

        const round: LotteryRoundState = {
          roundId:           BigInt(s.roundId.toString()),
          startSlot:         BigInt(s.startSlot.toString()),
          endSlot:           BigInt(endSlot),
          ticketCount:       BigInt(s.ticketCount.toString()),
          prizePoolLamports: BigInt(s.prizePoolLamports?.toString() ?? "0"),
          status,
          winner,
          voteCount:       0,   // votes tracked separately via DrawVote accounts
          activeNodeCount,
          thresholdBps,
        };

        slotRef.current = currentSlot;
        endSlotRef.current = endSlot;
        const countdown = Math.max(0, (endSlot - currentSlot) * MS_PER_SLOT);

        if (!cancelled) {
          setState({
            round,
            countdown,
            currentSlot,
            ticketPriceLamports,
            loading: false,
            error: null,
          });
        }
      } catch (err) {
        if (!cancelled) {
          setState(prev => ({
            ...prev,
            loading: false,
            error: err instanceof Error ? err.message : "Chain read failed",
          }));
        }
      }
    }

    fetchChainState();
    const id = setInterval(fetchChainState, POLL_INTERVAL_MS);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  return state;
}
