"use client";

import { use } from "react";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletProfile } from "@/hooks/useWalletProfile";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/Skeleton";

function fmtSol(lamports: bigint) {
  return (Number(lamports) / 1e9).toFixed(3) + " SOL";
}

export default function ProfilePage({ params }: { params: Promise<{ wallet: string }> }) {
  const { wallet } = use(params);
  const decoded = decodeURIComponent(wallet);
  const { publicKey } = useWallet();
  const isMe = publicKey?.toBase58() === decoded;

  const { profile, loading, notFound } = useWalletProfile(decoded);

  if (notFound && !loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-zinc-500 text-lg">No on-chain activity found for this wallet.</p>
        <p className="font-mono text-xs text-zinc-700 mt-2 break-all">{decoded}</p>
        <Link href="/leaderboard" className="text-violet-400 text-sm mt-4 inline-block hover:underline">
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
        <span className="text-zinc-300 font-mono truncate max-w-[200px]">{decoded.slice(0,8)}…{decoded.slice(-4)}</span>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-24 rounded-2xl" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-20" />)}
          </div>
          <Skeleton className="h-64" />
        </div>
      ) : profile && (<>

      {/* Header */}
      <div className="border border-zinc-800 bg-zinc-900/50 rounded-2xl p-5 flex items-center gap-4 flex-wrap">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-700 to-violet-900 flex items-center justify-center shrink-0">
          <span className="text-white font-bold font-mono text-lg">{decoded.slice(0, 2)}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <a
              href={`https://explorer.solana.com/address/${decoded}?cluster=devnet`}
              target="_blank" rel="noopener noreferrer"
              className="font-mono text-zinc-200 text-sm font-semibold truncate hover:text-violet-400 transition-colors"
            >
              {decoded}
            </a>
            {isMe && (
              <span className="text-[10px] bg-violet-800 text-violet-300 px-1.5 py-0.5 rounded-full shrink-0">you</span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500 flex-wrap">
            <span>Active since Round #{profile.firstSeenRound.toString()}</span>
            {profile.wins > 0 && (
              <>
                <span>·</span>
                <span className="text-emerald-500 font-semibold">{profile.wins} win{profile.wins > 1 ? "s" : ""}</span>
              </>
            )}
          </div>
        </div>

        {profile.wins > 0 && (
          <div className="shrink-0 text-center border border-amber-800 bg-amber-950/30 rounded-xl px-4 py-3">
            <p className="text-2xl font-bold text-amber-400">{profile.wins}</p>
            <p className="text-[10px] text-amber-600 uppercase tracking-widest mt-0.5">Win{profile.wins > 1 ? "s" : ""}</p>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total Tickets" value={profile.totalTickets.toString()} />
        <StatCard label="Total Spent"   value={fmtSol(profile.totalSpentLamports)} />
        <StatCard label="Total Won"     value={fmtSol(profile.totalWonLamports)} accent />
        <StatCard label="Win Rate"      value={`${profile.winRate}%`} />
      </div>

      {/* Round history */}
      <div className="border border-zinc-800 bg-zinc-900/50 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-800">
          <h2 className="text-sm font-semibold text-zinc-200">Round History</h2>
          <p className="text-xs text-zinc-600 mt-0.5">{profile.rounds.length} round{profile.rounds.length !== 1 ? "s" : ""} participated</p>
        </div>

        <div className="divide-y divide-zinc-800/50">
          {profile.rounds.map(r => (
            <div key={r.roundId.toString()} className={cn(
              "flex items-center gap-4 px-5 py-3 text-sm transition-colors",
              r.result === "won" ? "bg-emerald-950/20" : "hover:bg-zinc-800/20"
            )}>
              <div className={cn(
                "w-2 h-2 rounded-full shrink-0",
                r.result === "won" ? "bg-emerald-400" :
                r.result === "active" ? "bg-violet-400 animate-pulse" :
                "bg-zinc-700"
              )} />

              <Link
                href={`/rounds/${r.roundId.toString()}`}
                className="font-mono text-xs text-zinc-500 hover:text-violet-400 transition-colors shrink-0 w-16"
              >
                #{r.roundId.toString()}
              </Link>

              <div className="flex-1 min-w-0">
                <span className="text-zinc-400 text-xs">
                  {r.tickets} ticket{r.tickets > 1 ? "s" : ""}
                </span>
                <span className="text-zinc-600 text-xs ml-2">
                  Pool: {fmtSol(r.prizePoolLamports)}
                </span>
              </div>

              <div className="shrink-0 text-right">
                {r.result === "won" ? (
                  <span className="text-xs font-semibold text-emerald-400">
                    +{fmtSol(r.prizeWonLamports)}
                  </span>
                ) : r.result === "active" ? (
                  <span className="text-xs text-violet-400">In Play</span>
                ) : (
                  <span className="text-xs text-zinc-600">
                    -{fmtSol(BigInt(r.tickets) * profile.ticketPriceLamports)}
                  </span>
                )}
              </div>

              <span className="shrink-0 text-xs text-zinc-700 hidden sm:block w-20 text-right font-mono">
                slot #{r.closedAtSlot.toLocaleString()}
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
      <p className={cn("text-xl font-bold", accent ? "text-emerald-400" : "text-white")}>{value}</p>
    </div>
  );
}
