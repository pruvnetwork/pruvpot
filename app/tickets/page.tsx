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
        <h1 className="text-2xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>My Tickets</h1>
        <div className="rounded-xl p-8 text-center text-sm" style={{ background: "var(--surface-primary)", border: "1px solid var(--border-default)", color: "var(--text-muted)" }}>
          Connect your wallet to view your tickets.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>My Tickets</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
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
        <div className="rounded-xl p-4" style={{ background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.22)" }}>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "var(--purple-primary)" }} />
            <span className="text-sm font-semibold" style={{ color: "var(--purple-primary)" }}>
              {active.length} Active Ticket{active.length > 1 ? "s" : ""} — Round #{currentRoundId.toString()}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {active.map(t => (
              <div
                key={t.ticketIndex.toString()}
                className="rounded-lg px-3 py-2 text-center"
                style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.24)" }}
              >
                <p className="text-xs" style={{ color: "var(--purple-light)" }}>Ticket</p>
                <p className="text-lg font-bold" style={{ color: "var(--purple-primary)" }}>#{t.ticketIndex.toString()}</p>
              </div>
            ))}
          </div>
          {currentRoundTicketCount > 0n && (
            <>
              <p className="text-xs mt-3" style={{ color: "var(--text-muted)" }}>
                Win probability: {((active.length / Number(currentRoundTicketCount)) * 100).toFixed(1)}% with {active.length} of {currentRoundTicketCount.toString()} tickets
              </p>
              <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--surface-tertiary)" }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${Math.min((active.length / Number(currentRoundTicketCount)) * 100, 100)}%`, background: "var(--purple-primary)" }}
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
        <div className="rounded-xl p-8 text-center text-sm" style={{ background: "var(--surface-primary)", border: "1px solid var(--border-default)", color: "var(--text-muted)" }}>
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
                className="text-xs px-3 py-1.5 rounded-lg capitalize"
                style={{
                  background: filter === f ? "var(--purple-primary)" : "var(--surface-secondary)",
                  color: filter === f ? "#fff" : "var(--text-secondary)",
                  border: filter === f ? "none" : "1px solid var(--border-default)",
                  fontWeight: filter === f ? 600 : 400,
                  transition: "background 200ms ease, color 200ms ease",
                }}
              >
                {f} ({count})
              </button>
            );
          })}
        </div>

        <div className="space-y-2">
          {filtered.map((t) => {
            const rowStyle =
              t.status === "active" ? { background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.22)" } :
              t.status === "won"    ? { background: "rgba(5,150,105,0.06)",  border: "1px solid rgba(5,150,105,0.22)" } :
                                      { background: "var(--surface-secondary)", border: "1px solid var(--border-default)" };
            return (
              <div
                key={`${t.roundId}-${t.ticketIndex}`}
                className="flex items-center gap-4 p-4 rounded-xl text-sm"
                style={rowStyle}
              >
                <div className={cn("w-2 h-2 rounded-full shrink-0", t.status === "active" && "animate-pulse")}
                  style={{
                    background: t.status === "active" ? "var(--purple-primary)" :
                                t.status === "won"    ? "var(--success-color)" : "var(--text-faint)"
                  }}
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: "0.75rem" }}>
                      Round #{t.roundId.toString()}
                    </span>
                    <span style={{ color: "var(--border-default)" }}>·</span>
                    <span style={{ color: "var(--text-primary)", fontSize: "0.875rem" }}>
                      Ticket #{t.ticketIndex.toString()}
                    </span>
                    {t.status === "won" && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: "rgba(5,150,105,0.12)", color: "var(--success-color)", border: "1px solid rgba(5,150,105,0.24)" }}>
                        WON {(Number(t.prizeWonLamports) / 1e9).toFixed(3)} SOL
                      </span>
                    )}
                    {t.status === "active" && (
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(124,58,237,0.10)", color: "var(--purple-primary)", border: "1px solid rgba(124,58,237,0.20)" }}>
                        In Play
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-xs" style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>-{priceSOL.toFixed(3)} SOL</p>
                </div>
              </div>
            );
          })}
        </div>
      </>}
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-xl p-4" style={{ background: "var(--surface-secondary)", border: "1px solid var(--border-default)", boxShadow: "var(--shadow-card)" }}>
      <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>{label}</p>
      <p className="text-xl font-bold" style={{ color: accent ? "var(--success-color)" : "var(--text-primary)" }}>
        {value}
      </p>
    </div>
  );
}
