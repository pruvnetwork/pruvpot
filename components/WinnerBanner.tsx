"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ShareButton from "./ShareButton";

interface Props {
  winner: string;
  prizeSOL: number;
  roundId: bigint;
  onClose: () => void;
}

export default function WinnerBanner({ winner, prizeSOL, roundId, onClose }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    const auto = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 400);
    }, 12000);
    return () => { clearTimeout(t); clearTimeout(auto); };
  }, [onClose]);

  function dismiss() {
    setVisible(false);
    setTimeout(onClose, 400);
  }

  return (
    <div
      className="fixed left-0 right-0 z-50 px-4 flex justify-center"
      style={{
        top: "56px", // below nav
        transform: visible ? "translateY(0)" : "translateY(-120%)",
        transition: "transform 0.45s cubic-bezier(.22,1,.36,1)",
        pointerEvents: visible ? "auto" : "none",
      }}
    >
      <div
        className="w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl"
        style={{
          background: "linear-gradient(135deg, #064e3b, #065f46, #059669)",
        }}
      >
        <div className="flex items-center gap-4 px-5 py-4">
          {/* Trophy pulse */}
          <div className="shrink-0 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-xl animate-bounce">
            🏆
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-xs text-emerald-300 font-semibold uppercase tracking-widest">
              Round #{roundId.toString()} — Winner
            </p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-bold text-white tabular-nums">
                {prizeSOL.toFixed(3)} SOL
              </span>
              <Link
                href={`/u/${encodeURIComponent(winner)}`}
                className="font-mono text-emerald-300 text-sm truncate hover:text-emerald-200 hover:underline"
              >
                → {winner}
              </Link>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <ShareButton
              text={`🏆 PRUVPOT Round #${roundId.toString()} just closed — ${prizeSOL.toFixed(3)} SOL won by ${winner}. Provably fair lottery on Solana. No trust required.`}
              label="Share"
            />
            <button
              onClick={dismiss}
              className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-colors text-lg leading-none"
            >
              ×
            </button>
          </div>
        </div>

        {/* Progress bar — auto-dismiss timer */}
        <div className="h-0.5 bg-white/10">
          <div
            className="h-full bg-white/40 rounded-full"
            style={{ animation: visible ? "drainBar 12s linear forwards" : "none" }}
          />
        </div>
      </div>
    </div>
  );
}
