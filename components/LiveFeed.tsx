"use client";

import { useOnChainEvents } from "@/hooks/useOnChainEvents";

function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

function shortAddr(addr: string): string {
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

export default function LiveFeed() {
  const events = useOnChainEvents(8);

  // Only show ticket purchases and round events in the feed
  const feedItems = [...events]
    .filter(e => e.type === "TicketPurchased" || e.type === "RoundOpened" || e.type === "RoundFinalized")
    .reverse()
    .slice(0, 6);

  return (
    <div className="border border-zinc-800 bg-zinc-900/50 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-zinc-200">Live Activity</h3>
        <span className="flex items-center gap-1 text-xs text-emerald-500">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          live
        </span>
      </div>

      <div className="space-y-1.5 overflow-hidden min-h-[80px]">
        {feedItems.length === 0 && (
          <p className="text-xs text-zinc-600 py-4 text-center">Waiting for on-chain activity…</p>
        )}
        {feedItems.map((ev, i) => {
          const opacity = Math.max(0.3, 1 - i * 0.13);
          if (ev.type === "TicketPurchased") {
            return (
              <div
                key={`${ev.type}-${ev.roundId}-${ev.index}`}
                className="flex items-center gap-2 text-xs py-1.5 px-2 rounded-lg bg-zinc-800/40"
                style={{ opacity }}
              >
                <span className="text-violet-400 font-mono">{shortAddr(ev.buyer)}</span>
                <span className="text-zinc-600 flex-1">bought ticket #{ev.index.toString()}</span>
                <span className="text-zinc-600 font-mono">{timeAgo(ev.ts)}</span>
              </div>
            );
          }
          if (ev.type === "RoundOpened") {
            return (
              <div
                key={`${ev.type}-${ev.roundId}`}
                className="flex items-center gap-2 text-xs py-1.5 px-2 rounded-lg bg-zinc-800/20"
                style={{ opacity }}
              >
                <span className="text-zinc-500 flex-1 italic">🔔 Round #{ev.roundId.toString()} opened</span>
                <span className="text-zinc-600 font-mono">{timeAgo(ev.ts)}</span>
              </div>
            );
          }
          if (ev.type === "RoundFinalized") {
            return (
              <div
                key={`${ev.type}-${ev.roundId}`}
                className="flex items-center gap-2 text-xs py-1.5 px-2 rounded-lg bg-emerald-950/30 border border-emerald-900/40"
                style={{ opacity }}
              >
                <span className="text-emerald-400 flex-1">
                  🏆 {shortAddr(ev.winner)} won round #{ev.roundId.toString()}
                </span>
                <span className="text-zinc-600 font-mono">{timeAgo(ev.ts)}</span>
              </div>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
}
