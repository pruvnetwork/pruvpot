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
      <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Leaderboard</h1>

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
        <div className="rounded-xl p-8 text-center text-sm" style={{ background: "var(--surface-primary)", border: "1px solid var(--border-default)", color: "var(--text-muted)" }}>
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
              className="text-xs px-3 py-1.5 rounded-lg capitalize"
              style={{
                background: sort === s ? "var(--purple-primary)" : "var(--surface-secondary)",
                color: sort === s ? "#fff" : "var(--text-secondary)",
                border: sort === s ? "none" : "1px solid var(--border-default)",
                fontWeight: sort === s ? 600 : 400,
                transition: "background 200ms ease, color 200ms ease",
              }}
            >
              {s === "tickets" ? "Most Tickets" : s === "spent" ? "Most Spent" : "Most Won"}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="rounded-xl overflow-hidden" style={{ background: "var(--surface-secondary)", border: "1px solid var(--border-default)", boxShadow: "var(--shadow-panel)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs" style={{ borderBottom: "1px solid var(--border-default)", background: "var(--surface-tertiary)" }}>
                <th className="text-left px-4 py-3 font-medium" style={{ color: "var(--text-muted)" }}>Rank</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: "var(--text-muted)" }}>Wallet</th>
                <th className="text-right px-4 py-3 font-medium" style={{ color: "var(--text-muted)" }}>Tickets</th>
                <th className="text-right px-4 py-3 font-medium hidden sm:table-cell" style={{ color: "var(--text-muted)" }}>Spent</th>
                <th className="text-right px-4 py-3 font-medium" style={{ color: "var(--text-muted)" }}>Won</th>
                <th className="text-right px-4 py-3 font-medium hidden sm:table-cell" style={{ color: "var(--text-muted)" }}>Wins</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((e) => {
                const isMe = e.wallet === myWallet;
                const short = `${e.wallet.slice(0, 4)}…${e.wallet.slice(-4)}`;
                return (
                  <tr
                    key={e.wallet}
                    style={{
                      borderTop: "1px solid var(--border-soft)",
                      background: isMe ? "rgba(124, 58, 237, 0.06)" : "transparent",
                      transition: "background 150ms ease",
                    }}
                    onMouseEnter={(e2) => { if (!isMe) (e2.currentTarget as HTMLElement).style.background = "var(--surface-hover)"; }}
                    onMouseLeave={(e2) => { if (!isMe) (e2.currentTarget as HTMLElement).style.background = "transparent"; }}
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono font-bold">
                        {e.rank === 1 ? "🥇" : e.rank === 2 ? "🥈" : e.rank === 3 ? "🥉" :
                          <span style={{ color: "var(--text-muted)" }}>{`#${e.rank}`}</span>}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/u/${encodeURIComponent(e.wallet)}`}
                          className="font-mono transition-colors"
                          style={{ color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}
                          onMouseEnter={(el) => (el.currentTarget as HTMLElement).style.color = "var(--purple-primary)"}
                          onMouseLeave={(el) => (el.currentTarget as HTMLElement).style.color = "var(--text-primary)"}
                        >
                          {short}
                        </Link>
                        {isMe && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: "rgba(124,58,237,0.12)", color: "var(--purple-primary)", border: "1px solid rgba(124,58,237,0.20)" }}>
                            you
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold" style={{ color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>
                      {e.totalTickets}
                    </td>
                    <td className="px-4 py-3 text-right hidden sm:table-cell" style={{ color: "var(--text-secondary)", fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums" }}>
                      {(Number(e.totalSpentLamports) / 1e9).toFixed(3)} SOL
                    </td>
                    <td className="px-4 py-3 text-right font-semibold" style={{ color: "var(--success-color)", fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums" }}>
                      {e.totalWonLamports > 0n
                        ? `${(Number(e.totalWonLamports) / 1e9).toFixed(3)} SOL`
                        : <span style={{ color: "var(--text-faint)" }}>—</span>}
                    </td>
                    <td className="px-4 py-3 text-right hidden sm:table-cell" style={{ color: "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}>
                      {e.wins > 0 ? `${e.wins}x` : <span style={{ color: "var(--text-faint)" }}>—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* My position callout */}
        {myEntry && (
          <div className="rounded-xl p-4 flex items-center justify-between gap-4 flex-wrap" style={{ background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.18)" }}>
            <div>
              <p className="text-xs mb-0.5" style={{ color: "var(--text-muted)" }}>Your Position</p>
              <p className="font-semibold" style={{ color: "var(--purple-primary)" }}>
                #{myEntry.rank} · {myWallet.slice(0, 4)}…{myWallet.slice(-4)}
              </p>
            </div>
            <div className="flex gap-6 text-sm">
              <div className="text-center">
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Tickets</p>
                <p className="font-bold" style={{ color: "var(--text-primary)" }}>{myEntry.totalTickets}</p>
              </div>
              <div className="text-center">
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Won</p>
                <p className="font-bold" style={{ color: "var(--success-color)" }}>
                  {myEntry.totalWonLamports > 0n
                    ? `${(Number(myEntry.totalWonLamports) / 1e9).toFixed(3)} SOL`
                    : "—"}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Wins</p>
                <p className="font-bold" style={{ color: "var(--text-primary)" }}>{myEntry.wins > 0 ? `${myEntry.wins}x` : "—"}</p>
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

