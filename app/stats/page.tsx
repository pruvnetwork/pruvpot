"use client";

import Link from "next/link";
import { useRoundHistory } from "@/hooks/useRoundHistory";
import { useLotteryState } from "@/hooks/useLotteryState";
import { Skeleton } from "@/components/Skeleton";

export default function StatsPage() {
  const { history, totalPaidLamports, loading: historyLoading } = useRoundHistory();
  const { round, loading: roundLoading } = useLotteryState();

  const loading = historyLoading || roundLoading;

  const totalRounds = Number(round?.roundId ?? 0);
  const totalPrizeSOL = Number(totalPaidLamports) / 1e9;
  const totalTickets = history.reduce((s, r) => s + Number(r.ticketCount), 0);
  const avgPoolSOL = totalRounds > 0 ? totalPrizeSOL / Math.max(history.length, 1) : 0;

  const recent = [...history].slice(0, 14);
  const maxPool = Math.max(...recent.map(r => Number(r.prizePoolLamports)), 1);
  const maxTickets = Math.max(...recent.map(r => Number(r.ticketCount)), 1);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Stats</h1>

      {loading && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-20" />)}
          </div>
          <Skeleton className="h-52" />
          <Skeleton className="h-40" />
        </div>
      )}

      {!loading && <>
      {/* Overview cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card label="Total Rounds" value={totalRounds.toString()} />
        <Card label="Total Prize Paid" value={`${totalPrizeSOL.toFixed(3)} SOL`} accent />
        <Card label="Total Tickets Sold" value={totalTickets.toLocaleString()} />
        <Card label="Avg Pool / Round" value={`${avgPoolSOL.toFixed(3)} SOL`} />
      </div>

      {history.length === 0 && (
        <div className="rounded-xl p-8 text-center text-sm" style={{ background: "var(--surface-primary)", border: "1px solid var(--border-default)", color: "var(--text-muted)" }}>
          No finalized rounds yet.
        </div>
      )}

      {history.length > 0 && <>
      {/* Prize pool bar chart */}
      <div className="rounded-xl p-5" style={{ background: "var(--surface-secondary)", border: "1px solid var(--border-default)", boxShadow: "var(--shadow-panel)" }}>
        <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
          Prize Pool — Last {recent.length} Rounds
        </h2>
        <div className="flex items-end gap-1.5 h-36">
          {[...recent].reverse().map((r) => {
            const pct = (Number(r.prizePoolLamports) / maxPool) * 100;
            return (
              <div key={r.roundId.toString()} className="flex-1 flex flex-col items-center gap-1 group">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-center pointer-events-none" style={{ color: "var(--text-secondary)" }}>
                  {(Number(r.prizePoolLamports) / 1e9).toFixed(3)}
                </div>
                <div
                  className="w-full rounded-t-sm bg-violet-500 group-hover:bg-violet-400 transition-colors"
                  style={{ height: `${Math.max(pct, 4)}%` }}
                />
                <span className="text-[9px]" style={{ color: "var(--text-muted)" }}>#{r.roundId.toString()}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Ticket count chart */}
      <div className="rounded-xl p-5" style={{ background: "var(--surface-secondary)", border: "1px solid var(--border-default)", boxShadow: "var(--shadow-panel)" }}>
        <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
          Tickets Sold — Last {recent.length} Rounds
        </h2>
        <div className="flex items-end gap-1.5 h-28">
          {[...recent].reverse().map((r) => {
            const pct = (Number(r.ticketCount) / maxTickets) * 100;
            return (
              <div key={r.roundId.toString()} className="flex-1 flex flex-col items-center gap-1 group">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity text-xs" style={{ color: "var(--text-secondary)" }}>
                  {r.ticketCount.toString()}
                </div>
                <div
                  className="w-full rounded-t-sm bg-emerald-600 group-hover:bg-emerald-500 transition-colors"
                  style={{ height: `${Math.max(pct, 4)}%` }}
                />
                <span className="text-[9px]" style={{ color: "var(--text-muted)" }}>#{r.roundId.toString()}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Round history table */}
      <div className="rounded-xl overflow-hidden" style={{ background: "var(--surface-secondary)", border: "1px solid var(--border-default)", boxShadow: "var(--shadow-panel)" }}>
        <div className="px-5 pt-5 pb-3" style={{ borderBottom: "1px solid var(--border-default)", background: "var(--surface-tertiary)" }}>
          <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>All Rounds</h2>
        </div>
        <div className="overflow-x-auto p-5 pt-3">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-default)" }}>
                <th className="text-left pb-2 font-medium" style={{ color: "var(--text-muted)" }}>Round</th>
                <th className="text-right pb-2 font-medium" style={{ color: "var(--text-muted)" }}>Tickets</th>
                <th className="text-right pb-2 font-medium" style={{ color: "var(--text-muted)" }}>Pool</th>
                <th className="text-right pb-2 font-medium" style={{ color: "var(--text-muted)" }}>Winner Prize</th>
                <th className="text-right pb-2 font-medium" style={{ color: "var(--text-muted)" }}>Winner</th>
              </tr>
            </thead>
            <tbody>
              {history.map((r) => {
                const poolSOL = Number(r.prizePoolLamports) / 1e9;
                const winnerPrize = (poolSOL * 0.8).toFixed(4);
                const winnerShort = r.winner === "—"
                  ? "—"
                  : `${r.winner.slice(0, 4)}…${r.winner.slice(-4)}`;
                return (
                  <tr
                    key={r.roundId.toString()}
                    style={{ borderTop: "1px solid var(--border-soft)", transition: "background 150ms ease" }}
                    onMouseEnter={(e2) => (e2.currentTarget as HTMLElement).style.background = "var(--surface-hover)"}
                    onMouseLeave={(e2) => (e2.currentTarget as HTMLElement).style.background = "transparent"}
                  >
                    <td className="py-2 font-mono">
                      <Link
                        href={`/rounds/${r.roundId}`}
                        style={{ color: "var(--purple-primary)", fontFamily: "var(--font-mono)" }}
                        onMouseEnter={(el) => (el.currentTarget as HTMLElement).style.color = "var(--purple-light)"}
                        onMouseLeave={(el) => (el.currentTarget as HTMLElement).style.color = "var(--purple-primary)"}
                      >
                        #{r.roundId.toString()}
                      </Link>
                    </td>
                    <td className="py-2 text-right" style={{ color: "var(--text-secondary)", fontVariantNumeric: "tabular-nums" }}>{r.ticketCount.toString()}</td>
                    <td className="py-2 text-right" style={{ color: "var(--text-secondary)", fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums" }}>{poolSOL.toFixed(4)} SOL</td>
                    <td className="py-2 text-right font-semibold" style={{ color: "var(--success-color)", fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums" }}>{winnerPrize} SOL</td>
                    <td className="py-2 text-right font-mono" style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>{winnerShort}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Revenue breakdown */}
      <div className="rounded-xl p-5" style={{ background: "var(--surface-secondary)", border: "1px solid var(--border-default)", boxShadow: "var(--shadow-panel)" }}>
        <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Protocol Revenue (All Time)</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <RevenueCard label="Treasury (5%)"        sol={totalPrizeSOL * 0.05} color="violet" />
          <RevenueCard label="Node Operators (15%)" sol={totalPrizeSOL * 0.15} color="sky" />
          <RevenueCard label="Winners (80%)"        sol={totalPrizeSOL * 0.80} color="emerald" />
        </div>
      </div>
      </>}
      </>}
    </div>
  );
}

function Card({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-xl p-4" style={{ background: "var(--surface-secondary)", border: "1px solid var(--border-default)", boxShadow: "var(--shadow-card)" }}>
      <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>{label}</p>
      <p className="text-xl font-bold" style={{ color: accent ? "var(--success-color)" : "var(--text-primary)" }}>{value}</p>
    </div>
  );
}

function RevenueCard({ label, sol, color }: { label: string; sol: number; color: "violet" | "sky" | "emerald" }) {
  const styles = {
    violet:  { background: "rgba(124,58,237,0.06)",  border: "1px solid rgba(124,58,237,0.20)",  color: "var(--purple-primary)" },
    sky:     { background: "rgba(14,165,233,0.06)",  border: "1px solid rgba(14,165,233,0.20)",  color: "var(--cyan-accent)" },
    emerald: { background: "rgba(5,150,105,0.06)",   border: "1px solid rgba(5,150,105,0.20)",   color: "var(--success-color)" },
  };
  return (
    <div className="rounded-xl p-4" style={styles[color]}>
      <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>{label}</p>
      <p className="text-lg font-bold">{sol.toFixed(4)} SOL</p>
    </div>
  );
}
