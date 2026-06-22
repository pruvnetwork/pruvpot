"use client";

import { useState } from "react";
import { useToast } from "./Toast";

interface Props {
  status: 0 | 1 | 2;
  onBuy: () => Promise<void>;
  connected: boolean;
}

function getButtonStyle(status: 0 | 1 | 2, connected: boolean, loading: boolean, success: boolean) {
  if (status === 2) {
    return {
      background: "var(--surface-secondary)",
      color: "var(--text-faint)",
      cursor: "not-allowed" as const,
      border: "1px solid var(--border-default)",
      opacity: 0.7,
    };
  }
  if (status === 1) {
    return {
      background: "rgba(161, 98, 7, 0.15)",
      color: "#ca8a04",
      cursor: "not-allowed" as const,
      border: "1px solid rgba(161, 98, 7, 0.20)",
    };
  }
  if (!connected) {
    return {
      background: "linear-gradient(135deg, #A855F7 0%, #7C3AED 48%, #2563EB 100%)",
      color: "#fff",
      fontWeight: 600,
      boxShadow: "0 8px 24px rgba(124, 58, 237, 0.20)",
      cursor: "pointer" as const,
      border: "none",
    };
  }
  if (success) {
    return {
      background: "rgba(5, 150, 105, 0.12)",
      color: "var(--success-color)",
      border: "1px solid rgba(5, 150, 105, 0.25)",
      cursor: "default" as const,
    };
  }
  if (loading) {
    return {
      background: "rgba(109, 40, 217, 0.5)",
      color: "#c4b5fd",
      cursor: "wait" as const,
      border: "none",
    };
  }
  // Active buy state
  return {
    background: "linear-gradient(135deg, #A855F7 0%, #7C3AED 48%, #2563EB 100%)",
    color: "#fff",
    fontWeight: 600,
    boxShadow: "0 8px 24px rgba(124, 58, 237, 0.20)",
    cursor: "pointer" as const,
    border: "none",
  };
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

  const disabled = !connected || status !== 0 || loading;
  const btnStyle = getButtonStyle(status, connected, loading, success);
  const isActiveBuy = status === 0 && connected && !loading && !success;

  return (
    <div className="space-y-2">
      <button
        onClick={handle}
        disabled={disabled}
        className="relative w-full py-4 rounded-xl font-bold text-lg transition-all duration-200 overflow-hidden"
        style={btnStyle}
        onMouseEnter={(e) => {
          if (isActiveBuy) {
            (e.currentTarget as HTMLElement).style.filter = "brightness(1.04)";
            (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
            (e.currentTarget as HTMLElement).style.boxShadow = "0 10px 30px rgba(124, 58, 237, 0.28)";
          }
        }}
        onMouseLeave={(e) => {
          if (isActiveBuy) {
            (e.currentTarget as HTMLElement).style.filter = "";
            (e.currentTarget as HTMLElement).style.transform = "";
            (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 24px rgba(124, 58, 237, 0.20)";
          }
        }}
      >
        {/* Shimmer on idle */}
        {isActiveBuy && (
          <span
            className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent"
            style={{ animation: "shimmer 2.5s ease-in-out infinite" }}
          />
        )}

        {/* Loading bar */}
        {loading && (
          <span
            className="absolute bottom-0 left-0 h-0.5 bg-violet-300 rounded"
            style={{ animation: "loadBar 1.2s ease-in-out infinite" }}
          />
        )}

        <span className="relative z-10">
          {status === 2
            ? "Round Closed"
            : status === 1
            ? "Drawing in progress…"
            : !connected
            ? "Connect Wallet to Buy"
            : success
            ? "✓ Ticket Purchased!"
            : loading
            ? "Confirming on-chain…"
            : "Buy Ticket — 0.01 SOL"}
        </span>
      </button>

      {status === 0 && connected && (
        <p className="text-center text-xs" style={{ color: "var(--text-faint)" }}>
          Max 5 tickets per wallet · Transaction goes to prize pool
        </p>
      )}
    </div>
  );
}
