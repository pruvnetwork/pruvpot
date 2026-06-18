"use client";

import type { RoundHistory } from "@/lib/types";
import { lamportsToSol, shortenAddress, formatTime } from "@/lib/utils";

interface Props {
  history: RoundHistory[];
}

export default function RoundHistory({ history }: Props) {
  return (
    <div className="border border-zinc-800 bg-zinc-900/50 rounded-xl p-4">
      <h3 className="text-sm font-semibold text-zinc-200 mb-3">Past Rounds</h3>
      <div className="space-y-2">
        {history.map((r) => (
          <div
            key={r.roundId.toString()}
            className="flex items-center gap-3 p-2 rounded-lg bg-zinc-800/40 text-xs"
          >
            <span className="text-zinc-600 font-mono w-10">#{r.roundId.toString()}</span>
            <span className="text-zinc-300 font-mono flex-1">
              {shortenAddress(r.winner)}
            </span>
            <span className="text-emerald-400 font-semibold">
              {lamportsToSol(r.prizePoolLamports)} SOL
            </span>
            <span className="text-zinc-600">
              {r.ticketCount.toString()} tkts
            </span>
            <a
              href={`https://explorer.solana.com/tx/${r.txSig}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-600 hover:text-sky-400"
            >
              ↗
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
