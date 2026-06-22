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

  const feedItems = [...events]
    .filter(e => e.type === "TicketPurchased" || e.type === "RoundOpened" || e.type === "RoundFinalized")
    .reverse()
    .slice(0, 6);

  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          Live Activity
        </h3>
        <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: "#22D3EE" }}>
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{
              background: "#22D3EE",
              boxShadow: "0 0 6px rgba(34,211,238,0.7)",
              animation: "pulse 1.5s ease-in-out infinite",
            }}
          />
          live
        </span>
      </div>

      <div className="space-y-1.5 min-h-[80px]">
        {feedItems.length === 0 && (
          <p className="text-xs py-6 text-center" style={{ color: "var(--text-muted)" }}>
            Waiting for on-chain activity…
          </p>
        )}
        {feedItems.map((ev, i) => {
          const opacity = Math.max(0.35, 1 - i * 0.12);
          if (ev.type === "TicketPurchased") {
            return (
              <div
                key={`${ev.type}-${ev.roundId}-${ev.index}`}
                className="flex items-center gap-2 text-xs py-1.5 px-2.5 rounded-xl transition-colors duration-200"
                style={{
                  opacity,
                  background: "rgba(124,58,237,0.08)",
                  border: "1px solid rgba(124,58,237,0.12)",
                }}
              >
                <span className="font-mono font-semibold" style={{ color: "#A855F7" }}>
                  {shortAddr(ev.buyer)}
                </span>
                <span className="flex-1" style={{ color: "var(--text-muted)" }}>
                  bought ticket #{ev.index.toString()}
                </span>
                <span className="font-mono" style={{ color: "var(--text-muted)" }}>
                  {timeAgo(ev.ts)}
                </span>
              </div>
            );
          }
          if (ev.type === "RoundOpened") {
            return (
              <div
                key={`${ev.type}-${ev.roundId}`}
                className="flex items-center gap-2 text-xs py-1.5 px-2.5 rounded-xl"
                style={{ opacity, background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)" }}
              >
                <span className="flex-1 italic" style={{ color: "var(--text-muted)" }}>
                  Round #{ev.roundId.toString()} opened
                </span>
                <span className="font-mono" style={{ color: "var(--text-muted)" }}>
                  {timeAgo(ev.ts)}
                </span>
              </div>
            );
          }
          if (ev.type === "RoundFinalized") {
            return (
              <div
                key={`${ev.type}-${ev.roundId}`}
                className="flex items-center gap-2 text-xs py-1.5 px-2.5 rounded-xl"
                style={{
                  opacity,
                  background: "rgba(37,99,235,0.10)",
                  border: "1px solid rgba(37,99,235,0.20)",
                }}
              >
                <span className="flex-1 font-medium" style={{ color: "#38BDF8" }}>
                  🏆 {shortAddr(ev.winner)} won #{ev.roundId.toString()}
                </span>
                <span className="font-mono" style={{ color: "var(--text-muted)" }}>
                  {timeAgo(ev.ts)}
                </span>
              </div>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
}
