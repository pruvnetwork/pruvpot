"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ROUND_STATS, TOTAL_STATS } from "@/lib/mockData";
import { Skeleton } from "@/components/Skeleton";

export default function StatsPage() {
  const [loading, setLoading] = useState(true);
  useEffect(() => { const t = setTimeout(() => setLoading(false), 700); return () => clearTimeout(t); }, []);

  const max = Math.max(...ROUND_STATS.map(r => r.prizePoolSOL));
  const recent = [...ROUND_STATS].reverse().slice(0, 14).reverse();

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold text-white">Stats</h1>

      {loading && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-20" />)}
          </div>
          <Skeleton className="h-52" />
          <Skeleton className="h-40" />
        </div>
      )}

      {/* Overview cards */}
      {!loading && <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card label="Total Rounds" value={TOTAL_STATS.totalRounds.toString()} />
        <Card label="Total Prize Paid" value={`${TOTAL_STATS.totalPrizeSOL.toFixed(2)} SOL`} accent />
        <Card label="Total Tickets Sold" value={TOTAL_STATS.totalTickets.toLocaleString()} />
        <Card label="Avg Pool / Round" value={`${TOTAL_STATS.avgPoolSOL.toFixed(3)} SOL`} />
      </div>

      {/* Bar chart — last 14 rounds */}
      <div className="border border-zinc-800 bg-zinc-900/50 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-zinc-200 mb-4">
          Prize Pool — Last 14 Rounds
        </h2>
        <div className="flex items-end gap-1.5 h-36">
          {recent.map((r) => {
            const pct = (r.prizePoolSOL / max) * 100;
            return (
              <div key={r.roundId} className="flex-1 flex flex-col items-center gap-1 group">
                {/* Tooltip */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-zinc-400 text-center pointer-events-none">
                  {r.prizePoolSOL.toFixed(2)}
                </div>
                <div
                  className="w-full rounded-t-sm bg-violet-600 group-hover:bg-violet-400 transition-colors"
                  style={{ height: `${Math.max(pct, 4)}%` }}
                />
                <span className="text-[9px] text-zinc-600 rotate-0">
                  #{r.roundId}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Ticket count chart */}
      <div className="border border-zinc-800 bg-zinc-900/50 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-zinc-200 mb-4">
          Tickets Sold — Last 14 Rounds
        </h2>
        <div className="flex items-end gap-1.5 h-28">
          {recent.map((r) => {
            const maxT = Math.max(...recent.map(x => x.ticketCount));
            const pct = (r.ticketCount / maxT) * 100;
            return (
              <div key={r.roundId} className="flex-1 flex flex-col items-center gap-1 group">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-zinc-400">
                  {r.ticketCount}
                </div>
                <div
                  className="w-full rounded-t-sm bg-emerald-700 group-hover:bg-emerald-500 transition-colors"
                  style={{ height: `${Math.max(pct, 4)}%` }}
                />
                <span className="text-[9px] text-zinc-600">#{r.roundId}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Round history table */}
      <div className="border border-zinc-800 bg-zinc-900/50 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-zinc-200 mb-4">All Rounds</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-zinc-600 border-b border-zinc-800">
                <th className="text-left pb-2 font-medium">Round</th>
                <th className="text-right pb-2 font-medium">Tickets</th>
                <th className="text-right pb-2 font-medium">Pool</th>
                <th className="text-right pb-2 font-medium">Winner Prize</th>
                <th className="text-right pb-2 font-medium">Winner</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {[...ROUND_STATS].reverse().map((r) => (
                <tr key={r.roundId} className="hover:bg-zinc-800/30 transition-colors group">
                  <td className="py-2 font-mono">
                    <Link
                      href={`/rounds/${r.roundId}`}
                      className="text-violet-400 hover:text-violet-300 hover:underline"
                    >
                      #{r.roundId}
                    </Link>
                  </td>
                  <td className="py-2 text-right text-zinc-300">{r.ticketCount}</td>
                  <td className="py-2 text-right text-zinc-300">{r.prizePoolSOL.toFixed(3)} SOL</td>
                  <td className="py-2 text-right text-emerald-400 font-semibold">
                    {(r.prizePoolSOL * 0.8).toFixed(3)} SOL
                  </td>
                  <td className="py-2 text-right font-mono text-zinc-500">{r.winner}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Revenue breakdown */}
      <div className="border border-zinc-800 bg-zinc-900/50 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-zinc-200 mb-4">Protocol Revenue (All Time)</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <RevenueCard label="Treasury (5%)"        sol={TOTAL_STATS.totalPrizeSOL * 0.05} color="violet" />
          <RevenueCard label="Node Operators (15%)" sol={TOTAL_STATS.totalPrizeSOL * 0.15} color="sky" />
          <RevenueCard label="Winners (80%)"        sol={TOTAL_STATS.totalPrizeSOL * 0.80} color="emerald" />
        </div>
      </div>
      </>}
    </div>
  );
}

function Card({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="border border-zinc-800 bg-zinc-900/50 rounded-xl p-4">
      <p className="text-xs text-zinc-500 mb-1">{label}</p>
      <p className={`text-xl font-bold ${accent ? "text-emerald-400" : "text-white"}`}>{value}</p>
    </div>
  );
}

function RevenueCard({ label, sol, color }: { label: string; sol: number; color: "violet" | "sky" | "emerald" }) {
  const colors = {
    violet: "border-violet-800 bg-violet-950/30 text-violet-300",
    sky: "border-sky-800 bg-sky-950/30 text-sky-300",
    emerald: "border-emerald-800 bg-emerald-950/30 text-emerald-300",
  };
  return (
    <div className={`border rounded-xl p-4 ${colors[color]}`}>
      <p className="text-xs text-zinc-500 mb-1">{label}</p>
      <p className="text-lg font-bold">{sol.toFixed(3)} SOL</p>
      <p className="text-xs text-zinc-600 mt-0.5">${(sol * 65).toFixed(0)} @ $65</p>
    </div>
  );
}
