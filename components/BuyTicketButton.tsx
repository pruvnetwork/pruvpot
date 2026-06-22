"use client";

import { useState } from "react";
import { useToast } from "./Toast";

interface Props {
  status: 0 | 1 | 2;
  onBuy: () => Promise<void>;
  connected: boolean;
}

export default function BuyTicketButton({ status, onBuy, connected }: Props) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { promise } = useToast();

  async function handle() {
    if (!connected || status !== 0 || loading) return;
    setLoading(true);
    try {
      await promise(onBuy(), {
        loading: "Sending transaction…",
        success: "Ticket purchased! Good luck 🎟️",
        error: "Transaction failed",
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } finally {
      setLoading(false);
    }
  }

  const canBuy = connected && status === 0 && !loading;

  let btnStyle: React.CSSProperties;
  let btnLabel: string;
  let btnClass = "relative w-full py-4 rounded-2xl font-bold text-base transition-all duration-200 overflow-hidden";

  if (status === 2) {
    btnStyle = { background: "rgba(255,255,255,0.04)", color: "var(--text-muted)", cursor: "not-allowed", border: "1px solid var(--border)" };
    btnLabel = "Round Closed";
  } else if (status === 1) {
    btnStyle = { background: "rgba(234,179,8,0.08)", color: "#FBBF24", cursor: "not-allowed", border: "1px solid rgba(234,179,8,0.20)" };
    btnLabel = "Drawing in progress…";
  } else if (!connected) {
    btnStyle = {
      background: "linear-gradient(135deg, #7C3AED 0%, #2563EB 100%)",
      color: "#fff",
      boxShadow: "0 0 24px rgba(124,58,237,0.35), 0 4px 12px rgba(0,0,0,0.20)",
      cursor: "pointer",
    };
    btnLabel = "Connect Wallet to Buy";
  } else if (success) {
    btnStyle = { background: "linear-gradient(135deg, #059669, #10B981)", color: "#fff", boxShadow: "0 0 24px rgba(16,185,129,0.40)" };
    btnLabel = "✓ Ticket Purchased!";
  } else if (loading) {
    btnStyle = { background: "linear-gradient(135deg, #5B21B6, #1D4ED8)", color: "rgba(255,255,255,0.8)", cursor: "wait" };
    btnLabel = "Confirming on-chain…";
  } else {
    btnStyle = {
      background: "linear-gradient(135deg, #7C3AED 0%, #2563EB 100%)",
      color: "#fff",
      boxShadow: "0 0 24px rgba(124,58,237,0.35), 0 4px 16px rgba(0,0,0,0.20)",
      cursor: "pointer",
    };
    btnLabel = "Buy Ticket — 0.01 SOL";
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handle}
        disabled={!canBuy && status !== 0}
        className={btnClass}
        style={btnStyle}
        onMouseEnter={(e) => {
          if (canBuy) {
            (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
            (e.currentTarget as HTMLElement).style.boxShadow = "0 0 40px rgba(124,58,237,0.55), 0 8px 24px rgba(0,0,0,0.25)";
          }
        }}
        onMouseLeave={(e) => {
          if (canBuy) {
            (e.currentTarget as HTMLElement).style.transform = "";
            (e.currentTarget as HTMLElement).style.boxShadow = "0 0 24px rgba(124,58,237,0.35), 0 4px 16px rgba(0,0,0,0.20)";
          }
        }}
      >
        {/* Shimmer */}
        {canBuy && !success && (
          <span
            className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/12 to-transparent"
            style={{ animation: "shimmer 2.5s ease-in-out infinite" }}
          />
        )}
        {/* Loading bar */}
        {loading && (
          <span
            className="absolute bottom-0 left-0 h-0.5 rounded"
            style={{
              background: "linear-gradient(90deg, #A855F7, #38BDF8)",
              animation: "loadBar 1.2s ease-in-out infinite",
            }}
          />
        )}
        <span className="relative z-10">{btnLabel}</span>
      </button>

      {status === 0 && connected && (
        <p className="text-center text-xs" style={{ color: "var(--text-muted)" }}>
          Max 5 tickets per wallet · Transaction goes to prize pool
        </p>
      )}
    </div>
  );
}
