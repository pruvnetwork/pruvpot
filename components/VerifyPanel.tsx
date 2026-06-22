"use client";

import { useState } from "react";

interface Props {
  roundId: bigint;
  endSlot: bigint;
  ticketCount: bigint;
}

export default function VerifyPanel({ roundId, endSlot, ticketCount }: Props) {
  const [open, setOpen] = useState(false);

  // Mirror of deriveWinnerIndex from pruv-solana-main/sdk/src/lottery.ts
  function computeExample() {
    const exampleHash = new Uint8Array(32).fill(0xab);
    const ridBuf = new Uint8Array(8);
    const tcBuf = new Uint8Array(8);
    const view = new DataView(ridBuf.buffer);
    // write roundId low 32 bits (demo only — BigInt not fully shown)
    view.setUint32(0, Number(roundId & 0xffffffffn), true);
    const view2 = new DataView(tcBuf.buffer);
    view2.setUint32(0, Number(ticketCount & 0xffffffffn), true);
    const acc = new Uint8Array(8);
    for (let i = 0; i < 8; i++) {
      acc[i] =
        (exampleHash[i] ^
          exampleHash[i + 8] ^
          exampleHash[i + 16] ^
          exampleHash[i + 24] ^
          ridBuf[i] ^
          tcBuf[i]) &
        0xff;
    }
    const result =
      (acc[0] |
        (acc[1] << 8) |
        (acc[2] << 16) |
        (acc[3] << 24)) >>>
      0;
    return (result % Number(ticketCount)).toString();
  }

  return (
    <div
      className="rounded-xl p-4"
      style={{
        background: "var(--surface-primary)",
        border: "1px solid var(--border-default)",
        boxShadow: "var(--shadow-card)",
        transition: "border-color 200ms ease",
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between"
      >
        <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          Verify Randomness Yourself
        </span>
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="mt-4 space-y-3 text-xs font-mono">
          <div className="rounded-lg p-3 space-y-1" style={{ background: "var(--surface-tertiary)", border: "1px solid var(--border-soft)" }}>
            <p style={{ color: "var(--text-secondary)" }}>Formula (identical on-chain + off-chain):</p>
            <p style={{ color: "var(--purple-primary)", fontFamily: "var(--font-mono)" }}>
              acc[i] = slotHash[i] ^ slotHash[i+8] ^ slotHash[i+16] ^ slotHash[i+24]
            </p>
            <p style={{ color: "var(--purple-primary)", fontFamily: "var(--font-mono)" }}>
              acc[i] ^= roundId_LE[i] ^ ticketCount_LE[i]
            </p>
            <p style={{ color: "var(--purple-primary)", fontFamily: "var(--font-mono)" }}>
              winner = readU64LE(acc) % ticketCount
            </p>
          </div>

          <div className="rounded-lg p-3 space-y-1" style={{ background: "var(--surface-secondary)", border: "1px solid var(--border-default)" }}>
            <p style={{ color: "var(--text-secondary)" }}>Round #{roundId.toString()} inputs:</p>
            <p style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>End Slot: {endSlot.toString()}</p>
            <p style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>Ticket Count: {ticketCount.toString()}</p>
            <p style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>SlotHash: fetched from Solana sysvar at end slot</p>
          </div>

          <div className="rounded-lg p-3" style={{ background: "rgba(37, 99, 235, 0.06)", border: "1px solid rgba(37, 99, 235, 0.18)" }}>
            <p className="mb-1" style={{ color: "var(--text-secondary)" }}>Anyone can recompute:</p>
            <p style={{ color: "var(--blue-primary)", fontFamily: "var(--font-mono)", wordBreak: "break-all" }}>
              $ solana slot-hash {endSlot.toString()} | pruv derive-winner --round {roundId.toString()} --tickets {ticketCount.toString()}
            </p>
          </div>

          <p className="leading-relaxed" style={{ color: "var(--text-muted)" }}>
            The slot hash at the end slot is determined by Solana consensus —
            no operator can influence it. PRUV nodes independently compute the
            same index and cast on-chain votes. Finalization only succeeds when
            ≥ 2/3 agree.
          </p>
        </div>
      )}
    </div>
  );
}
