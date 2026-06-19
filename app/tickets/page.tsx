"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useMyTickets } from "@/hooks/useMyTickets";
import { cn } from "@/lib/utils";
import { TableSkeleton } from "@/components/Skeleton";
import LuckShareCard from "@/components/LuckShareCard";

type Filter = "all" | "active" | "won" | "lost";

export default function TicketsPage() {
  const { publicKey } = useWallet();
  const walletAddress = publicKey?.toBase58() ?? null;

  const {
    tickets,
    totalSpentLamports,
    totalWonLamports,
    ticketPriceLamports,
    currentRoundId,
    currentRoundTicketCount,
    loading,
  } = useMyTickets(walletAddress);

  const [filter, setFilter] = useState<Filter>("all");

  const wins = tickets.filter(t => t.status === "won");
  const active = tickets.filter(t => t.status === "active" && t.roundId === currentRoundId);
  const winRate = tickets.length > 0 ? ((wins.length / tickets.length) * 100).toFixed(1) : "0.0";
  const totalWonSOL = Number(totalWonLamports) / 1e9;
  const totalSpentSOL = Number(totalSpentLamports) / 1e9;
  const priceSOL = Number(ticketPriceLamports) / 1e9;

  const filtered = tickets.filter(t => filter === "all" || t.status === filter);

  if (!walletAddress) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-white mb-4">My Tickets</h1>
        <div className="border border-zinc-800 bg-zinc-900/50 rounded-xl p-8 text-center text-zinc-500 text-sm">
          Connect your wallet to view your tickets.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">My Tickets</h1>
        <p className="text-zinc-500 text-sm mt-1 font-mono">
          {walletAddress.slice(0, 6)}…{walletAddress.slice(-6)}
        </p>
      </div>

      {/* Stats row */}
      {!loading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Total Tickets" value={tickets.length.toString()} />
          <StatCard label="Total Spent" value={`${totalSpentSOL.toFixed(3)} SOL`} />
          <StatCard label="Total Won" value={`${totalWonSOL.toFixed(3)} SOL`} accent />
          <StatCard label="Win Rate" value={`${winRate}%`} />
        </div>
      )}

      {/* Share card */}
      {!loading && tickets.length > 0 && (
        <LuckShareCard
          activeTickets={active.length}
          totalTickets={tickets.length}
          winRate={winRate}
          totalWonSOL={totalWonSOL}
        />
      )}

      {/* Active tickets in current round */}
      {!loading && active.length > 0 && (
        <div className="border border-violet-800 bg-violet-950/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
            <span className="text-sm font-semibold text-violet-300">
              {active.length} Active Ticket{active.length > 1 ? "s" : ""} — Round #{currentRoundId.toString()}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {active.map(t => (
              <div
                key={t.ticketIndex.toString()}
                className="border border-violet-700 bg-violet-900/30 rounded-lg px-3 py-2 text-center"
              >
                <p className="text-xs text-violet-400">Ticket</p>
                <p className="text-lg font-bold text-white">#{t.ticketIndex.toString()}</p>
              </div>
            ))}
          </div>
          {currentRoundTicketCount > 0n && (
            <>
              <p className="text-xs text-zinc-600 mt-3">
                Win probability: {((active.length / Number(currentRoundTicketCount)) * 100).toFixed(1)}% with {active.length} of {currentRoundTicketCount.toString()} tickets
              </p>
              <div className="mt-2 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-violet-500 rounded-full transition-all duration-700"
                  style={{ width: `${Math.min((active.length / Number(currentRoundTicketCount)) * 100, 100)}%` }}
                />
              </div>
            </>
          )}
        </div>
      )}

      {/* Loading */}
      {loading && <TableSkeleton rows={6} />}

      {/* Empty state */}
      {!loading && tickets.length === 0 && (
        <div className="border border-zinc-800 bg-zinc-900/50 rounded-xl p-8 text-center text-zinc-500 text-sm">
          No tickets found for this wallet.
        </div>
      )}

      {/* Filter tabs + list */}
      {!loading && tickets.length > 0 && <>
        <div className="flex gap-2 flex-wrap">
          {(["all", "active", "won", "lost"] as Filter[]).map(f => {
            const count = f === "all" ? tickets.length : tickets.filter(t => t.status === f).length;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "text-xs px-3 py-1.5 rounded-lg capitalize transition-colors",
                  filter === f ? "bg-violet-600 text-white" : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                )}
              >
                {f} ({count})
              </button>
            );
          })}
        </div>

        <div className="space-y-2">
          {filtered.map((t) => (
            <div
              key={`${t.roundId}-${t.ticketIndex}`}
              className={cn(
                "flex items-center gap-4 p-4 rounded-xl border text-sm",
                t.status === "active" ? "border-violet-800 bg-violet-950/20" :
                t.status === "won"    ? "border-emerald-800 bg-emerald-950/20" :
                                        "border-zinc-800 bg-zinc-900/40"
              )}
            >
              <div className={cn(
                "w-2 h-2 rounded-full shrink-0",
                t.status === "active" ? "bg-violet-400 animate-pulse" :
                t.status === "won"    ? "bg-emerald-400" : "bg-zinc-600"
              )} />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs text-zinc-500">Round #{t.roundId.toString()}</span>
                  <span className="text-zinc-600">·</span>
                  <span className="text-zinc-300">Ticket #{t.ticketIndex.toString()}</span>
                  {t.status === "won" && (
                    <span className="text-xs bg-emerald-900 text-emerald-400 px-2 py-0.5 rounded-full font-semibold">
                      WON {(Number(t.prizeWonLamports) / 1e9).toFixed(3)} SOL
                    </span>
                  )}
                  {t.status === "active" && (
                    <span className="text-xs bg-violet-900/50 text-violet-400 px-2 py-0.5 rounded-full">
                      In Play
                    </span>
                  )}
                </div>
              </div>

              <div className="text-right shrink-0">
                <p className="text-xs text-zinc-600">-{priceSOL.toFixed(3)} SOL</p>
              </div>
            </div>
          ))}
        </div>
      </>}
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
