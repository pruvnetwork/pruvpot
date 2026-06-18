"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { getProfile } from "@/lib/mockData";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/Skeleton";

const MY_WALLET = "9ZwL...kFpQ";

function timeAgo(ts: number) {
  const s = Math.floor(Date.now() / 1000 - ts);
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function ProfilePage({ params }: { params: Promise<{ wallet: string }> }) {
  const { wallet } = use(params);
  const decoded = decodeURIComponent(wallet);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(t);
  }, []);

  const profile = getProfile(decoded);
  const isMe = decoded === MY_WALLET;

  if (!loading && !profile) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-zinc-500 text-lg">Wallet not found in leaderboard.</p>
        <Link href="/leaderboard" className="text-violet-400 text-sm mt-3 inline-block hover:underline">
          ← Back to Leaderboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-zinc-500">
        <Link href="/leaderboard" className="hover:text-zinc-300 transition-colors">Leaderboard</Link>
        <span>›</span>
        <span className="text-zinc-300 font-mono">{decoded}</span>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-24 rounded-2xl" />
          <div className="grid grid-cols-3 gap-3">
            {[1,2,3].map(i => <Skeleton key={i} className="h-20" />)}
          </div>
          <Skeleton className="h-64" />
        </div>
      ) : profile && (<>

      {/* Header */}
      <div className="border border-zinc-800 bg-zinc-900/50 rounded-2xl p-5 flex items-center gap-4 flex-wrap">
        {/* Avatar placeholder */}
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-700 to-violet-900 flex items-center justify-center shrink-0">
          <span className="text-white font-bold font-mono text-lg">
            {decoded.slice(0, 2)}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-zinc-200 text-sm font-semibold truncate">{decoded}</span>
            {isMe && (
              <span className="text-[10px] bg-violet-800 text-violet-300 px-1.5 py-0.5 rounded-full shrink-0">
                you
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500 flex-wrap">
            <span>
              Rank{" "}
              <span className={cn(
                "font-bold",
                profile.rank === 1 ? "text-yellow-400" :
                profile.rank === 2 ? "text-zinc-300" :
                profile.rank === 3 ? "text-amber-600" : "text-zinc-400"
              )}>
                {profile.rank === 1 ? "🥇 #1" : profile.rank === 2 ? "🥈 #2" : profile.rank === 3 ? "🥉 #3" : `#${profile.rank}`}
              </span>
            </span>
            <span>·</span>
            <span>Active since Round #{profile.firstSeenRound}</span>
            {profile.wins > 0 && (
              <>
                <span>·</span>
                <span className="text-emerald-500 font-semibold">{profile.wins} win{profile.wins > 1 ? "s" : ""}</span>
              </>
            )}
          </div>
        </div>

        {profile.winStreak > 0 && (
          <div className="shrink-0 text-center border border-amber-800 bg-amber-950/30 rounded-xl px-4 py-3">
            <p className="text-2xl font-bold text-amber-400">{profile.winStreak}</p>
            <p className="text-[10px] text-amber-600 uppercase tracking-widest mt-0.5">Win Streak</p>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total Tickets" value={profile.totalTickets.toString()} />
        <StatCard label="Total Spent" value={`${profile.totalSpentSOL.toFixed(2)} SOL`} />
        <StatCard label="Total Won" value={`${profile.totalWonSOL.toFixed(3)} SOL`} accent />
        <StatCard label="Win Rate" value={`${profile.winRate}%`} />
      </div>

      {/* Round history */}
      <div className="border border-zinc-800 bg-zinc-900/50 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-800">
          <h2 className="text-sm font-semibold text-zinc-200">Round History</h2>
          <p className="text-xs text-zinc-600 mt-0.5">Last {profile.rounds.length} rounds</p>
        </div>

        <div className="divide-y divide-zinc-800/50">
          {profile.rounds.map(r => (
            <div key={r.roundId} className={cn(
              "flex items-center gap-4 px-5 py-3 text-sm transition-colors",
              r.result === "won" ? "bg-emerald-950/20" : "hover:bg-zinc-800/20"
            )}>
              {/* Result dot */}
              <div className={cn(
                "w-2 h-2 rounded-full shrink-0",
                r.result === "won" ? "bg-emerald-400" :
                r.result === "active" ? "bg-violet-400 animate-pulse" :
                "bg-zinc-700"
              )} />

              {/* Round link */}
              <Link
                href={`/rounds/${r.roundId}`}
                className="font-mono text-xs text-zinc-500 hover:text-violet-400 transition-colors shrink-0 w-16"
              >
                #{r.roundId}
              </Link>

              {/* Tickets */}
              <div className="flex-1 min-w-0">
                <span className="text-zinc-400 text-xs">
                  {r.tickets} ticket{r.tickets > 1 ? "s" : ""}
                </span>
                <span className="text-zinc-600 text-xs ml-2">
                  Pool: {r.prizePoolSOL.toFixed(2)} SOL
                </span>
              </div>

              {/* Result */}
              <div className="shrink-0 text-right">
                {r.result === "won" ? (
                  <span className="text-xs font-semibold text-emerald-400">
                    +{r.prizeWonSOL?.toFixed(3)} SOL
                  </span>
                ) : r.result === "active" ? (
                  <span className="text-xs text-violet-400">In Play</span>
                ) : (
                  <span className="text-xs text-zinc-600">-{(r.tickets * 0.01).toFixed(2)} SOL</span>
                )}
              </div>

              {/* Time */}
              <span className="shrink-0 text-xs text-zinc-700 hidden sm:block w-16 text-right">
                {r.result === "active" ? "now" : timeAgo(r.closedAt)}
              </span>
            </div>
          ))}
        </div>
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
