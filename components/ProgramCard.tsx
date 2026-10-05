"use client";

import { useEffect, useState } from "react";
import { PROGRAM_ID, fetchConfigLocked } from "@/lib/lottery-client";
import { fetchProgramInfo, type ProgramInfo } from "@/lib/program-info";
import { getConnection } from "@/lib/rpc";
import { shortenAddress } from "@/lib/utils";

/**
 * Honest trust card: what is verifiable about this deployment today, and what
 * is not yet. Replaces the earlier hard-coded "ZK Attested / Trust 97" badge,
 * which described a planned attestation flow as if it were live.
 */
export default function ProgramCard({ activeNodes }: { activeNodes: number }) {
  const [expanded, setExpanded] = useState(false);
  const [locked, setLocked] = useState<boolean | null>(null);
  const [info, setInfo] = useState<ProgramInfo | null>(null);
  const id = PROGRAM_ID.toBase58();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const conn = getConnection();
      const [l, i] = await Promise.all([fetchConfigLocked(conn).catch(() => null), fetchProgramInfo(conn)]);
      if (!cancelled) { setLocked(l); setInfo(i); }
    })();
    return () => { cancelled = true; };
  }, []);

  const upgradeLabel =
    info?.upgradeAuthority === undefined ? "reading…"
    : info.upgradeAuthority === null ? "immutable (authority revoked)"
    : `upgradeable by ${shortenAddress(info.upgradeAuthority, 4)}`;

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
          <Row label="Seed" value="Poseidon over 8 slot hashes after end_slot" />
          <Row label="Winner rule" value="on-chain, re-derived per vote" />
          <Row label="Nodes" value={`${activeNodes} active on devnet`} />
          <Row label="Payout" value="program-owned PDA → wallets" />
          <Row label="Config" value={locked === null ? "reading…" : locked ? "locked (irreversible)" : "changeable by authority"} />
          <Row
            label="Bytecode"
            value={upgradeLabel}
            href={info?.upgradeAuthority ? `https://explorer.solana.com/address/${info.upgradeAuthority}?cluster=devnet` : undefined}
          />
          <Row label="ZK attestation" value="not live yet" />
          <p className="mt-3 text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
            Everything above can be checked from public chain data (see “Verify this round yourself”).
            The operator cannot choose a winner; what it can still do is listed honestly above: change
            config until it is locked, and upgrade the program while an upgrade authority exists.
            PRUV’s zero-knowledge allocation proofs are not part of this devnet deployment.
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
