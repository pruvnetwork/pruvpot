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
    <div
      className="rounded-xl p-4"
      style={{
        background: "rgba(5, 150, 105, 0.06)",
        border: "1px solid rgba(5, 150, 105, 0.20)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between gap-3"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg" style={{ color: "var(--success-color)" }}>✓</span>
          <span className="font-semibold text-sm" style={{ color: "var(--success-color)" }}>
            ZK Attested Program
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(5, 150, 105, 0.10)", color: "var(--success-color)", fontFamily: "var(--font-mono)" }}>
            Trust {attestation.trustScore}/100
          </span>
        </div>
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>{expanded ? "▲" : "▼"}</span>
      </button>

      {expanded && (
        <div className="mt-4 space-y-2 text-xs font-mono">
          <Row label="Program ID" value={shortenAddress(attestation.programId, 6)} />
          <Row label="Bytecode Hash" value={attestation.programHash.slice(0, 20) + "…"} />
          <Row label="Signed by" value={`${attestation.nodeCount} nodes`} />
          <Row label="Attested at" value={formatTime(attestation.attestedAt)} />
          <Row label="Expires in" value={`${hoursLeft}h`} />
          <p className="mt-3 text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
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
      <span style={{ color: "var(--text-muted)" }}>{label}</span>
      <span style={{ color: "var(--text-secondary)" }}>{value}</span>
    </div>
  );
}
