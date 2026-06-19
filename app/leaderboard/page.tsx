"use client";

import { useState } from "react";
import Link from "next/link";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { useWallet } from "@solana/wallet-adapter-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/Skeleton";

type Sort = "tickets" | "spent" | "won";

export default function LeaderboardPage() {
  const [sort, setSort] = useState<Sort>("tickets");
  const { entries, loading } = useLeaderboard();
  const { publicKey } = useWallet();
  const myWallet = publicKey?.toBase58() ?? "";

  const sorted = [...entries].sort((a, b) => {
    if (sort === "tickets") return b.totalTickets - a.totalTickets;
    if (sort === "spent") return Number(b.totalSpentLamports - a.totalSpentLamports);
    return Number(b.totalWonLamports - a.totalWonLamports);
  }).map((e, i) => ({ ...e, rank: i + 1 }));

  const topThree = sorted.slice(0, 3);
  const myEntry = sorted.find(e => e.wallet === myWallet);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold text-white">Leaderboard</h1>

      {loading && (
        <div className="space-y-4">
          <div className="flex items-end justify-center gap-3 pt-4 h-36">
            <Skeleton className="flex-1 max-w-[140px] h-24 rounded-t-xl" />
            <Skeleton className="flex-1 max-w-[140px] h-32 rounded-t-xl" />
            <Skeleton className="flex-1 max-w-[140px] h-16 rounded-t-xl" />
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      )}

      {!loading && entries.length === 0 && (
        <div className="border border-zinc-800 bg-zinc-900/50 rounded-xl p-8 text-center text-zinc-500 text-sm">
          No ticket holders yet.
        </div>
      )}

      {!loading && entries.length > 0 && <>
        {/* Podium */}
        {topThree.length >= 3 && (
          <div className="flex items-end justify-center gap-3 pt-4">
            <Podium entry={topThree[1]} height="h-24" label="2nd" myWallet={myWallet} />
            <Podium entry={topThree[0]} height="h-32" label="1st" crown myWallet={myWallet} />
            <Podium entry={topThree[2]} height="h-16" label="3rd" myWallet={myWallet} />
          </div>
        )}

        {/* Sort tabs */}
        <div className="flex gap-2">
          {(["tickets", "spent", "won"] as Sort[]).map(s => (
            <button
              key={s}
              onClick={() => setSort(s)}
              className={cn(
                "text-xs px-3 py-1.5 rounded-lg capitalize transition-colors",
                sort === s ? "bg-violet-600 text-white" : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
              )}
            >
              {s === "tickets" ? "Most Tickets" : s === "spent" ? "Most Spent" : "Most Won"}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="border border-zinc-800 bg-zinc-900/50 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-xs text-zinc-500">
                <th className="text-left px-4 py-3 font-medium">Rank</th>
                <th className="text-left px-4 py-3 font-medium">Wallet</th>
                <th className="text-right px-4 py-3 font-medium">Tickets</th>
                <th className="text-right px-4 py-3 font-medium hidden sm:table-cell">Spent</th>
                <th className="text-right px-4 py-3 font-medium">Won</th>
                <th className="text-right px-4 py-3 font-medium hidden sm:table-cell">Wins</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {sorted.map((e) => {
                const isMe = e.wallet === myWallet;
                const short = `${e.wallet.slice(0, 4)}…${e.wallet.slice(-4)}`;
                return (
                  <tr
                    key={e.wallet}
                    className={cn(
                      "transition-colors",
                      isMe ? "bg-violet-950/30" : "hover:bg-zinc-800/30"
                    )}
                  >
                    <td className="px-4 py-3">
                      <span className={cn(
                        "font-mono font-bold",
                        e.rank === 1 ? "text-yellow-400" :
                        e.rank === 2 ? "text-zinc-300" :
                        e.rank === 3 ? "text-amber-600" : "text-zinc-600"
                      )}>
                        {e.rank === 1 ? "🥇" : e.rank === 2 ? "🥈" : e.rank === 3 ? "🥉" : `#${e.rank}`}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/u/${encodeURIComponent(e.wallet)}`}
                          className="font-mono text-zinc-300 hover:text-violet-400 transition-colors"
                        >
                          {short}
                        </Link>
                        {isMe && (
                          <span className="text-[10px] bg-violet-800 text-violet-300 px-1.5 py-0.5 rounded-full">
                            you
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-zinc-200">
                      {e.totalTickets}
                    </td>
                    <td className="px-4 py-3 text-right text-zinc-400 hidden sm:table-cell">
                      {(Number(e.totalSpentLamports) / 1e9).toFixed(3)} SOL
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-emerald-400">
                      {e.totalWonLamports > 0n
                        ? `${(Number(e.totalWonLamports) / 1e9).toFixed(3)} SOL`
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-zinc-500 hidden sm:table-cell">
                      {e.wins > 0 ? `${e.wins}x` : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* My position callout */}
        {myEntry && (
          <div className="border border-violet-800 bg-violet-950/20 rounded-xl p-4 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs text-zinc-500 mb-0.5">Your Position</p>
              <p className="font-semibold text-violet-300">
                #{myEntry.rank} · {myWallet.slice(0, 4)}…{myWallet.slice(-4)}
              </p>
            </div>
            <div className="flex gap-6 text-sm">
              <div className="text-center">
                <p className="text-zinc-500 text-xs">Tickets</p>
                <p className="font-bold text-white">{myEntry.totalTickets}</p>
              </div>
              <div className="text-center">
                <p className="text-zinc-500 text-xs">Won</p>
                <p className="font-bold text-emerald-400">
                  {myEntry.totalWonLamports > 0n
                    ? `${(Number(myEntry.totalWonLamports) / 1e9).toFixed(3)} SOL`
                    : "—"}
                </p>
              </div>
              <div className="text-center">
                <p className="text-zinc-500 text-xs">Wins</p>
                <p className="font-bold text-white">{myEntry.wins > 0 ? `${myEntry.wins}x` : "—"}</p>
              </div>
            </div>
          </div>
        )}
      </>}
    </div>
  );
}

interface PodiumEntry {
  wallet: string;
  totalTickets: number;
  rank: number;
}

function Podium({
  entry, height, label, crown, myWallet,
}: {
  entry: PodiumEntry;
  height: string;
  label: string;
  crown?: boolean;
  myWallet: string;
}) {
  const isMe = entry.wallet === myWallet;
  const short = `${entry.wallet.slice(0, 4)}…${entry.wallet.slice(-4)}`;
  return (
    <div className="flex flex-col items-center gap-2 flex-1 max-w-[140px]">
      {crown && <span className="text-xl">👑</span>}
      <p className={cn("text-xs font-mono truncate w-full text-center", isMe ? "text-violet-300" : "text-zinc-400")}>
        {short}
      </p>
      <p className="text-xs text-emerald-400 font-semibold">{entry.totalTickets} tkts</p>
      <div className={cn(
        "w-full rounded-t-xl flex items-end justify-center pb-2",
        height,
        crown ? "bg-gradient-to-t from-yellow-800 to-yellow-600" :
        label === "2nd" ? "bg-gradient-to-t from-zinc-700 to-zinc-500" :
        "bg-gradient-to-t from-amber-900 to-amber-700"
      )}>
        <span className="text-xs font-bold text-white/70">{label}</span>
      </div>
    </div>
  );
}

