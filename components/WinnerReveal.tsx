"use client";

import { useEffect, useState } from "react";
import Confetti from "./Confetti";
import ShareButton from "./ShareButton";

interface Props {
  winner: string;
  prizeSOL: number;
  roundId: bigint;
}

export default function WinnerReveal({ winner, prizeSOL, roundId }: Props) {
  const [visible, setVisible] = useState(false);
  const [confetti, setConfetti] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 100);
    const t2 = setTimeout(() => setConfetti(true), 400);
    const t3 = setTimeout(() => setConfetti(false), 4500);
    return () => [t1, t2, t3].forEach(clearTimeout);
  }, []);

  return (
    <>
      <Confetti active={confetti} />

      <div
        className="mt-6 rounded-xl overflow-hidden winner-glow"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "scale(1) translateY(0)" : "scale(0.92) translateY(10px)",
          transition: "opacity 0.55s cubic-bezier(.22,1,.36,1), transform 0.55s cubic-bezier(.22,1,.36,1)",
        }}
      >
        {/* Animated gradient border */}
        <div
          className="p-px rounded-xl"
          style={{
            background: "linear-gradient(135deg, #059669, #34d399, #059669)",
            backgroundSize: "200% 200%",
            animation: "gradientShift 3s ease infinite",
          }}
        >
          <div className="bg-zinc-950 rounded-xl p-5 text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="text-lg">🏆</span>
              <p className="text-xs text-emerald-500 uppercase tracking-[0.2em]">
                Round #{roundId.toString()} Winner
              </p>
            </div>

            {/* Prize amount with number reveal */}
            <div className="flex items-baseline justify-center gap-2 mb-4">
              <span
                className="text-5xl font-bold text-white tabular-nums"
                style={{ textShadow: "0 0 30px rgba(52,211,153,0.5)" }}
              >
                {prizeSOL.toFixed(3)}
              </span>
              <span className="text-2xl text-emerald-400 font-semibold">SOL</span>
            </div>

            {/* Winner address */}
            <div className="inline-flex items-center gap-2 bg-emerald-950/60 border border-emerald-700 rounded-lg px-4 py-2.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono text-emerald-300 text-sm font-semibold">
                {winner}
              </span>
            </div>

            <p className="text-xs text-zinc-600 mt-4 mb-4">
              Transferred automatically via on-chain CPI
            </p>

            <div className="flex items-center justify-center gap-2 flex-wrap">
              <ShareButton
                text={`🏆 Just won ${prizeSOL.toFixed(3)} SOL on PRUVPOT — provably fair lottery on Solana. Round #${roundId.toString()} · No trust required, winner derived from on-chain SlotHash.`}
                label="Share your win"
              />
              <ShareButton
                text={`🎰 PRUVPOT Round #${roundId.toString()} just closed — ${prizeSOL.toFixed(3)} SOL jackpot won! Provably fair, on-chain randomness powered by PRUV Protocol.`}
                label="Announce round"
                variant="icon"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
