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
    <div className="border border-zinc-800 bg-zinc-900/50 rounded-xl p-4">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between"
      >
        <span className="text-sm font-semibold text-zinc-200">
          Verify Randomness Yourself
        </span>
        <span className="text-xs text-zinc-500">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="mt-4 space-y-3 text-xs font-mono">
          <div className="bg-zinc-800/60 rounded-lg p-3 space-y-1">
            <p className="text-zinc-500">Formula (identical on-chain + off-chain):</p>
            <p className="text-sky-300">
              acc[i] = slotHash[i] ^ slotHash[i+8] ^ slotHash[i+16] ^ slotHash[i+24]
            </p>
            <p className="text-sky-300">
              acc[i] ^= roundId_LE[i] ^ ticketCount_LE[i]
            </p>
            <p className="text-sky-300">
              winner = readU64LE(acc) % ticketCount
            </p>
          </div>

          <div className="bg-zinc-800/60 rounded-lg p-3 space-y-1">
            <p className="text-zinc-500">Round #{roundId.toString()} inputs:</p>
            <p className="text-zinc-400">End Slot: {endSlot.toString()}</p>
            <p className="text-zinc-400">Ticket Count: {ticketCount.toString()}</p>
            <p className="text-zinc-400">SlotHash: fetched from Solana sysvar at end slot</p>
          </div>

          <div className="bg-emerald-950/50 border border-emerald-900 rounded-lg p-3">
            <p className="text-zinc-500 mb-1">Anyone can recompute:</p>
            <p className="text-emerald-400">
              $ solana slot-hash {endSlot.toString()} | pruv derive-winner --round {roundId.toString()} --tickets {ticketCount.toString()}
            </p>
          </div>

          <p className="text-zinc-600 leading-relaxed">
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
