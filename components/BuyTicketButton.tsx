"use client";

import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
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

  const disabled = !connected || status !== 0 || loading;

  return (
    <div className="space-y-2">
      <button
        onClick={handle}
        disabled={disabled}
        className={cn(
          "relative w-full py-4 rounded-xl font-bold text-lg transition-all duration-200 overflow-hidden",
          status === 2
            ? "bg-zinc-800 text-zinc-600 cursor-not-allowed"
            : status === 1
            ? "bg-yellow-900/50 text-yellow-600 cursor-not-allowed"
            : !connected
            ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
            : success
            ? "bg-emerald-700 text-white"
            : loading
            ? "bg-violet-800 text-violet-200 cursor-wait"
            : "bg-violet-600 hover:bg-violet-500 active:scale-[0.98] text-white shadow-[0_0_24px_rgba(139,92,246,0.35)] hover:shadow-[0_0_36px_rgba(139,92,246,0.5)]"
        )}
      >
        {/* Shimmer on idle */}
        {status === 0 && connected && !loading && !success && (
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
        <p className="text-center text-xs text-zinc-600">
          Max 5 tickets per wallet · Transaction goes to prize pool
        </p>
      )}
    </div>
  );
}
