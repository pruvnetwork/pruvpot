"use client";

import { useState, useEffect } from "react";
import { MY_TICKETS } from "@/lib/mockData";
import { cn } from "@/lib/utils";
import { TableSkeleton } from "@/components/Skeleton";
import LuckShareCard from "@/components/LuckShareCard";

const WALLET = "9ZwL...kFpQ";
const TOTAL_TICKETS = MY_TICKETS.length;
const ACTIVE = MY_TICKETS.filter(t => t.status === "active");
const WINS = MY_TICKETS.filter(t => t.status === "won");
const TOTAL_WON = WINS.reduce((a, t) => a + (t.prizeSOL ?? 0), 0);
const TOTAL_SPENT = TOTAL_TICKETS * 0.01;
const WIN_RATE = ((WINS.length / TOTAL_TICKETS) * 100).toFixed(1);

function timeAgo(ms: number) {
  const diff = Date.now() - ms;
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function TicketsPage() {
  const [filter, setFilter] = useState<"all" | "active" | "won" | "lost">("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  const filtered = MY_TICKETS.filter(t => filter === "all" || t.status === filter);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">My Tickets</h1>
        <p className="text-zinc-500 text-sm mt-1 font-mono">{WALLET}</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total Tickets" value={TOTAL_TICKETS.toString()} />
        <StatCard label="Total Spent" value={`${TOTAL_SPENT.toFixed(2)} SOL`} />
        <StatCard label="Total Won" value={`${TOTAL_WON.toFixed(3)} SOL`} accent />
        <StatCard label="Win Rate" value={`${WIN_RATE}%`} />
      </div>

      {/* Share card */}
      <LuckShareCard
        activeTickets={ACTIVE.length}
        totalTickets={TOTAL_TICKETS}
        winRate={WIN_RATE}
        totalWonSOL={TOTAL_WON}
      />

      {/* Active tickets highlight */}
      {ACTIVE.length > 0 && (
        <div className="border border-violet-800 bg-violet-950/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
            <span className="text-sm font-semibold text-violet-300">
              {ACTIVE.length} Active Ticket{ACTIVE.length > 1 ? "s" : ""} — Round #42
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {ACTIVE.map(t => (
              <div
                key={t.ticketIndex}
                className="border border-violet-700 bg-violet-900/30 rounded-lg px-3 py-2 text-center"
              >
                <p className="text-xs text-violet-400">Ticket</p>
                <p className="text-lg font-bold text-white">#{t.ticketIndex}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-zinc-600 mt-3">
            Win probability: {((ACTIVE.length / 47) * 100).toFixed(1)}% with {ACTIVE.length} of 47 tickets
          </p>
          {/* Probability bar */}
          <div className="mt-2 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-violet-500 rounded-full"
              style={{ width: `${Math.min((ACTIVE.length / 47) * 100, 100)}%`, transition: "width 0.6s ease" }}
            />
          </div>
        </div>
      )}

      {/* Skeleton */}
      {loading && <TableSkeleton rows={6} />}

      {/* Filter tabs + Ticket list */}
      {!loading && (<>
      <div className="flex gap-2 flex-wrap">
        {(["all", "active", "won", "lost"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "text-xs px-3 py-1.5 rounded-lg capitalize transition-colors",
              filter === f
                ? "bg-violet-600 text-white"
                : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
            )}
          >
            {f} {f === "all" ? `(${MY_TICKETS.length})` : `(${MY_TICKETS.filter(t => t.status === f).length})`}
          </button>
        ))}
      </div>

      {/* Ticket list */}
      <div className="space-y-2">
        {filtered.map((t, i) => (
          <div
            key={i}
            className={cn(
              "flex items-center gap-4 p-4 rounded-xl border text-sm",
              t.status === "active" ? "border-violet-800 bg-violet-950/20" :
              t.status === "won"    ? "border-emerald-800 bg-emerald-950/20" :
                                      "border-zinc-800 bg-zinc-900/40"
            )}
          >
            {/* Status dot */}
            <div className={cn(
              "w-2 h-2 rounded-full shrink-0",
              t.status === "active" ? "bg-violet-400 animate-pulse" :
              t.status === "won"    ? "bg-emerald-400" : "bg-zinc-600"
            )} />

            {/* Ticket info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs text-zinc-500">Round #{t.roundId}</span>
                <span className="text-zinc-600">·</span>
                <span className="text-zinc-300">Ticket #{t.ticketIndex}</span>
                {t.status === "won" && (
                  <span className="text-xs bg-emerald-900 text-emerald-400 px-2 py-0.5 rounded-full font-semibold">
                    WON {t.prizeSOL?.toFixed(3)} SOL
                  </span>
                )}
                {t.status === "active" && (
                  <span className="text-xs bg-violet-900/50 text-violet-400 px-2 py-0.5 rounded-full">
                    In Play
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-600 mt-0.5">{timeAgo(t.boughtAt)}</p>
            </div>

            {/* Cost */}
            <div className="text-right shrink-0">
              <p className="text-xs text-zinc-600">-0.010 SOL</p>
              <a
                href={`https://explorer.solana.com/tx/${t.txSig}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-sky-600 hover:text-sky-400"
              >
                {t.txSig} ↗
              </a>
            </div>
          </div>
        ))}
      </div>
      </>)}
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="border border-zinc-800 bg-zinc-900/50 rounded-xl p-4">
      <p className="text-xs text-zinc-500 mb-1">{label}</p>
      <p className={cn("text-xl font-bold", accent ? "text-emerald-400" : "text-white")}>
        {value}
      </p>
    </div>
  );
}
