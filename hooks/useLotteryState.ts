"use client";

import { useEffect, useRef, useState } from "react";
import { Connection, PublicKey } from "@solana/web3.js";
import { Program, AnchorProvider } from "@coral-xyz/anchor";
import IDL from "@/lib/idl/pruv_lottery.json";
import { PROGRAM_ID, getConfigPDA, getLotteryStatePDA } from "@/lib/lottery-client";
import type { LotteryRoundState } from "@/lib/types";

const RPC = process.env.NEXT_PUBLIC_RPC_URL ?? "https://api.devnet.solana.com";

// Slot time is not a constant. Devnet has been measured at ~165ms/slot while
// this file assumed 400ms, which made the countdown over-report the time left
// by ~2.4x — a 1800-slot round really lasts ~5 minutes but displayed as ~12.
// Users came back to a round the UI had promised was still open, so measure it.
const FALLBACK_MS_PER_SLOT = 400;
const MIN_MS_PER_SLOT = 50;
const MAX_MS_PER_SLOT = 2_000;
const REMEASURE_INTERVAL_MS = 60_000;
const TICK_MS = 200;
const POLL_INTERVAL_MS = 5_000;

/** Derive ms-per-slot from recent cluster performance, with a sane fallback. */
async function measureMsPerSlot(conn: Connection): Promise<number> {
  try {
    const samples = await conn.getRecentPerformanceSamples(5);
    let slots = 0;
    let secs = 0;
    for (const s of samples) {
      if (s.numSlots > 0 && s.samplePeriodSecs > 0) {
        slots += s.numSlots;
        secs += s.samplePeriodSecs;
      }
    }
    if (slots === 0) return FALLBACK_MS_PER_SLOT;
    const ms = (secs * 1000) / slots;
    if (!Number.isFinite(ms) || ms < MIN_MS_PER_SLOT || ms > MAX_MS_PER_SLOT) {
      return FALLBACK_MS_PER_SLOT;
    }
    return ms;
  } catch {
    return FALLBACK_MS_PER_SLOT;
  }
}

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
  msPerSlot: number;      // measured, not assumed
  loading: boolean;
  error: string | null;
}

export function useLotteryState(): LotteryChainState {
  const [state, setState] = useState<LotteryChainState>({
    round: null,
    countdown: 0,
    currentSlot: 0,
    ticketPriceLamports: BigInt(10_000_000),
    msPerSlot: FALLBACK_MS_PER_SLOT,
    loading: true,
    error: null,
  });

  // Anchor the countdown to (slot, wall-clock) captured at the last poll.
  const endSlotRef    = useRef(0);
  const anchorSlotRef = useRef(0);
  const anchorTimeRef = useRef(0);
  const msPerSlotRef  = useRef(FALLBACK_MS_PER_SLOT);
  const measuredAtRef = useRef(0);

  // Interpolate between polls off the wall clock. The previous version added
  // one slot per tick, which only stays accurate while the tick interval and
  // the real slot time agree — the very assumption that was wrong.
  useEffect(() => {
    const id = setInterval(() => {
      if (anchorTimeRef.current === 0) return;
      const total     = (endSlotRef.current - anchorSlotRef.current) * msPerSlotRef.current;
      const remaining = Math.max(0, total - (Date.now() - anchorTimeRef.current));
      setState(prev => (prev.countdown === remaining ? prev : { ...prev, countdown: remaining }));
    }, TICK_MS);
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

        // Slot time drifts slowly, so re-measure about once a minute rather
        // than on every 5s poll.
        const now = Date.now();
        if (now - measuredAtRef.current > REMEASURE_INTERVAL_MS) {
          msPerSlotRef.current = await measureMsPerSlot(connection);
          measuredAtRef.current = now;
        }
        const msPerSlot = msPerSlotRef.current;

        anchorSlotRef.current = currentSlot;
        anchorTimeRef.current = Date.now();
        endSlotRef.current    = endSlot;
        const countdown = Math.max(0, (endSlot - currentSlot) * msPerSlot);

        if (!cancelled) {
          setState({
            round,
            countdown,
            currentSlot,
            ticketPriceLamports,
            msPerSlot,
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
