"use client";

import { useState } from "react";
import ShareButton from "./ShareButton";
import { useToast } from "./Toast";

interface Props {
  activeTickets: number;
  totalTickets: number;
  winRate: string;
  totalWonSOL: number;
  roundId?: number;
}

export default function LuckShareCard({ activeTickets, totalTickets, winRate, totalWonSOL, roundId = 42 }: Props) {
  const [expanded, setExpanded] = useState(false);
  const { toast } = useToast();
  const winPct = totalTickets > 0 ? ((activeTickets / totalTickets) * 100).toFixed(1) : "0.0";

  const shareText = activeTickets > 0
    ? `🎟️ I'm in! ${activeTickets} ticket${activeTickets > 1 ? "s" : ""} in PRUVPOT Round #${roundId} — ${winPct}% win chance. Provably fair lottery on Solana powered by PRUV Protocol. Join me 👇`
    : `🎰 Playing PRUVPOT — provably fair lottery on Solana. ${totalTickets} tickets bought, ${winRate}% win rate. Winner picked from on-chain SlotHash, no trust needed.`;

  function copyStats() {
    const text = `My PRUVPOT stats:\n• Tickets: ${totalTickets}\n• Win rate: ${winRate}%\n• Total won: ${totalWonSOL.toFixed(3)} SOL\n• pruvpot.vercel.app`;
    navigator.clipboard.writeText(text).catch(() => {});
    toast("Stats copied to clipboard!", "success");
  }

  return (
    <div className="border border-zinc-800 bg-zinc-900/50 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-zinc-800/30 transition-colors"
      >
        <span className="flex items-center gap-2 text-zinc-300 font-medium">
          <span>📣</span> Share your stats
        </span>
        <span className="text-zinc-600 text-xs">{expanded ? "▲" : "▼"}</span>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-zinc-800/60">
          {/* Stats card preview */}
          <div className="mt-4 bg-gradient-to-br from-violet-950/60 to-zinc-900 border border-violet-800/40 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 bg-violet-600 rounded-md flex items-center justify-center text-[10px] font-bold">P</div>
              <span className="text-xs font-semibold text-violet-300">PRUVPOT</span>
              <span className="text-xs text-zinc-600 ml-auto">Round #{roundId}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-zinc-600">Active tickets</p>
                <p className="text-xl font-bold text-white">{activeTickets}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-600">Win chance</p>
                <p className="text-xl font-bold text-violet-400">{winPct}%</p>
              </div>
              <div>
                <p className="text-xs text-zinc-600">All-time won</p>
                <p className="text-lg font-bold text-emerald-400">{totalWonSOL.toFixed(3)} SOL</p>
              </div>
              <div>
                <p className="text-xs text-zinc-600">Win rate</p>
                <p className="text-lg font-bold text-white">{winRate}%</p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <ShareButton
              text={shareText}
              label={activeTickets > 0 ? "Share my tickets" : "Share my stats"}
            />
            <button
              onClick={copyStats}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-sm font-medium text-zinc-300 transition-all"
            >
              ⎘ Copy stats
            </button>
          </div>

          <p className="text-xs text-zinc-700">
            Sharing helps grow the prize pool — more players = bigger jackpot for everyone.
          </p>
        </div>
      )}
    </div>
  );
}
