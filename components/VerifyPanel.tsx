"use client";

import { useState } from "react";

interface Props {
  roundId: bigint;
  endSlot: bigint;
  ticketCount: bigint;
}

export default function VerifyPanel({ roundId, endSlot, ticketCount }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between group"
      >
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-lg flex items-center justify-center text-sm"
            style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.20), rgba(37,99,235,0.15))", border: "1px solid rgba(124,58,237,0.25)" }}
          >
            ✓
          </div>
          <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Verify Randomness
          </span>
        </div>
        <span
          className="text-xs transition-transform duration-200 font-mono"
          style={{
            color: "var(--text-muted)",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            display: "inline-block",
          }}
        >
          ▼
        </span>
      </button>

      {open && (
        <div className="mt-4 space-y-3 text-xs font-mono">
          <div
            className="rounded-xl p-3 space-y-1.5"
            style={{
              background: "rgba(124,58,237,0.06)",
              border: "1px solid rgba(124,58,237,0.15)",
            }}
          >
            <p className="font-sans not-italic text-xs font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
              Formula (identical on-chain + off-chain):
            </p>
            <p style={{ color: "#A855F7" }}>acc[i] = slotHash[i] ^ slotHash[i+8] ^ slotHash[i+16] ^ slotHash[i+24]</p>
            <p style={{ color: "#A855F7" }}>acc[i] ^= roundId_LE[i] ^ ticketCount_LE[i]</p>
            <p style={{ color: "#38BDF8" }}>winner = readU64LE(acc) % ticketCount</p>
          </div>

          <div
            className="rounded-xl p-3 space-y-1"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)" }}
          >
            <p className="font-sans not-italic text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
              Round #{roundId.toString()} inputs:
            </p>
            <p style={{ color: "var(--text-muted)" }}>End Slot: {endSlot.toString()}</p>
            <p style={{ color: "var(--text-muted)" }}>Ticket Count: {ticketCount.toString()}</p>
            <p style={{ color: "var(--text-muted)" }}>SlotHash: fetched from Solana sysvar at end slot</p>
          </div>

          <div
            className="rounded-xl p-3"
            style={{
              background: "rgba(37,99,235,0.08)",
              border: "1px solid rgba(37,99,235,0.20)",
            }}
          >
            <p className="font-sans not-italic text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
              Anyone can recompute:
            </p>
            <p style={{ color: "#38BDF8", wordBreak: "break-all" }}>
              $ solana slot-hash {endSlot.toString()} | pruv derive-winner --round {roundId.toString()} --tickets {ticketCount.toString()}
            </p>
          </div>

          <p className="font-sans not-italic leading-relaxed" style={{ color: "var(--text-muted)" }}>
            The slot hash is determined by Solana consensus — no operator can influence it. PRUV nodes independently compute the same index and cast on-chain votes. Finalization only succeeds when ≥ 2/3 agree.
          </p>
        </div>
      )}
    </div>
  );
}
