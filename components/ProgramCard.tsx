"use client";

import { useState } from "react";
import { PROGRAM_ID } from "@/lib/lottery-client";
import { shortenAddress } from "@/lib/utils";

/**
 * Honest trust card: what is verifiable about this deployment today, and what
 * is not yet. Replaces the earlier hard-coded "ZK Attested / Trust 97" badge,
 * which described a planned attestation flow as if it were live.
 */
export default function ProgramCard({ activeNodes }: { activeNodes: number }) {
  const [expanded, setExpanded] = useState(false);
  const id = PROGRAM_ID.toBase58();

  return (
    <div
      className="rounded-xl p-4"
      style={{ background: "var(--surface-primary)", border: "1px solid var(--border-default)", boxShadow: "var(--shadow-card)" }}
    >
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
            Program & trust model
          </span>
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{ background: "var(--surface-tertiary)", color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}
          >
            devnet
          </span>
        </div>
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>{expanded ? "▲" : "▼"}</span>
      </button>

      {expanded && (
        <div className="mt-4 space-y-2 text-xs font-mono">
          <Row
            label="Program"
            value={shortenAddress(id, 6)}
            href={`https://explorer.solana.com/address/${id}?cluster=devnet`}
          />
          <Row label="Seed" value="SlotHashes sysvar at end_slot" />
          <Row label="Winner rule" value="on-chain, re-derived per vote" />
          <Row label="Nodes" value={`${activeNodes} active on devnet`} />
          <Row label="Payout" value="program-owned PDA → wallets" />
          <Row label="ZK attestation" value="not live yet" />
          <p className="mt-3 text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
            Everything above can be checked from public chain data (see “Verify this round yourself”).
            PRUV’s node attestation and zero-knowledge allocation proofs are being integrated and are not
            part of this devnet deployment; nothing here is attested by a ZK proof today.
          </p>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, href }: { label: string; value: string; href?: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span style={{ color: "var(--text-muted)" }}>{label}</span>
      {href ? (
        <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: "var(--blue-primary)" }}>
          {value} ↗
        </a>
      ) : (
        <span style={{ color: "var(--text-secondary)" }}>{value}</span>
      )}
    </div>
  );
}
