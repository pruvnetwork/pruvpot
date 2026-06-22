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
    <div
      className="rounded-xl p-4"
      style={{
        background: "var(--surface-primary)",
        border: "1px solid var(--border-default)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Live Activity</h3>
        <span className="flex items-center gap-1 text-xs" style={{ color: "var(--success-color)" }}>
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--success-color)" }} />
          live
        </span>
      </div>

      <div className="space-y-1.5 overflow-hidden min-h-[80px]">
        {feedItems.length === 0 && (
          <p className="text-xs py-4 text-center" style={{ color: "var(--text-faint)" }}>Waiting for on-chain activity…</p>
        )}
        {feedItems.map((ev, i) => {
          const opacity = Math.max(0.3, 1 - i * 0.13);
          if (ev.type === "TicketPurchased") {
            return (
              <div
                key={`${ev.type}-${ev.roundId}-${ev.index}`}
                className="flex items-center gap-2 text-xs py-1.5 px-2 rounded-lg"
                style={{ opacity, background: "var(--surface-secondary)", border: "1px solid var(--border-soft)" }}
              >
                <span style={{ color: "var(--purple-primary)", fontFamily: "var(--font-mono)" }}>{shortAddr(ev.buyer)}</span>
                <span className="flex-1" style={{ color: "var(--text-secondary)" }}>bought ticket #{ev.index.toString()}</span>
                <span style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>{timeAgo(ev.ts)}</span>
              </div>
            );
          }
          if (ev.type === "RoundOpened") {
            return (
              <div
                key={`${ev.type}-${ev.roundId}`}
                className="flex items-center gap-2 text-xs py-1.5 px-2 rounded-lg"
                style={{ opacity, background: "var(--surface-tertiary)", border: "1px solid var(--border-soft)" }}
              >
                <span className="flex-1 italic" style={{ color: "var(--text-muted)" }}>🔔 Round #{ev.roundId.toString()} opened</span>
                <span style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>{timeAgo(ev.ts)}</span>
              </div>
            );
          }
          if (ev.type === "RoundFinalized") {
            return (
              <div
                key={`${ev.type}-${ev.roundId}`}
                className="flex items-center gap-2 text-xs py-1.5 px-2 rounded-lg"
                style={{ opacity, background: "rgba(5, 150, 105, 0.06)", border: "1px solid rgba(5, 150, 105, 0.18)" }}
              >
                <span className="flex-1" style={{ color: "var(--success-color)" }}>
                  🏆 {shortAddr(ev.winner)} won round #{ev.roundId.toString()}
                </span>
                <span style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>{timeAgo(ev.ts)}</span>
              </div>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
}
