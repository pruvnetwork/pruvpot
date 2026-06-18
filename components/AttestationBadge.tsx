"use client";

import { useState } from "react";
import type { AttestationStatus } from "@/lib/types";
import { formatTime, shortenAddress } from "@/lib/utils";

interface Props {
  attestation: AttestationStatus;
}

export default function AttestationBadge({ attestation }: Props) {
  const [expanded, setExpanded] = useState(false);
  const hoursLeft = Math.floor((attestation.expiresAt - Date.now() / 1000) / 3600);

  return (
    <div className="border border-emerald-700 bg-emerald-950/40 rounded-xl p-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between gap-3"
      >
        <div className="flex items-center gap-2">
          <span className="text-emerald-400 text-lg">✓</span>
          <span className="text-emerald-300 font-semibold text-sm">
            ZK Attested Program
          </span>
          <span className="bg-emerald-900 text-emerald-300 text-xs px-2 py-0.5 rounded-full font-mono">
            Trust {attestation.trustScore}/100
          </span>
        </div>
        <span className="text-zinc-500 text-xs">{expanded ? "▲" : "▼"}</span>
      </button>

      {expanded && (
        <div className="mt-4 space-y-2 text-xs font-mono">
          <Row label="Program ID" value={shortenAddress(attestation.programId, 6)} />
          <Row label="Bytecode Hash" value={attestation.programHash.slice(0, 20) + "…"} />
          <Row label="Signed by" value={`${attestation.nodeCount} nodes`} />
          <Row label="Attested at" value={formatTime(attestation.attestedAt)} />
          <Row label="Expires in" value={`${hoursLeft}h`} />
          <p className="text-zinc-500 mt-3 text-xs leading-relaxed">
            PRUV nodes verified this program&apos;s bytecode via Halo2 ZK proof and anchored the
            hash on-chain. Any code change invalidates the attestation immediately.
          </p>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-zinc-500">{label}</span>
      <span className="text-zinc-200">{value}</span>
    </div>
  );
}
