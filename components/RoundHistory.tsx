"use client";

import type { RoundHistory } from "@/lib/types";
import { lamportsToSol, shortenAddress, formatTime } from "@/lib/utils";

interface Props {
  history: RoundHistory[];
}

export default function RoundHistory({ history }: Props) {
  return (
    <div
      className="rounded-xl p-4"
      style={{
        background: "var(--surface-primary)",
        border: "1px solid var(--border-default)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>Past Rounds</h3>
      <div className="space-y-2">
        {history.map((r) => (
          <div
            key={r.roundId.toString()}
            className="flex items-center gap-3 p-2 rounded-lg text-xs"
            style={{ background: "var(--surface-secondary)" }}
          >
            <span className="w-10" style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>#{r.roundId.toString()}</span>
            <span className="flex-1" style={{ color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>
              {shortenAddress(r.winner)}
            </span>
            <span style={{ color: "var(--success-color)", fontWeight: 600 }}>
              {lamportsToSol(r.prizePoolLamports)} SOL
            </span>
            <span style={{ color: "var(--text-muted)" }}>
              {r.ticketCount.toString()} tkts
            </span>
            <a
              href={`https://explorer.solana.com/tx/${r.txSig}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--blue-primary)" }}
            >
              ↗
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
