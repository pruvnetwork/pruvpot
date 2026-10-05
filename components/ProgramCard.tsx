"use client";

import { useEffect, useState } from "react";
import { PROGRAM_ID, fetchConfigLocked } from "@/lib/lottery-client";
import { fetchProgramInfo, type ProgramInfo } from "@/lib/program-info";
import { getConnection } from "@/lib/rpc";
import { shortenAddress } from "@/lib/utils";
import {
  fetchAttestation, fetchAttestationConfig,
  type AttestationInfo, type AttestationConfigInfo,
} from "@/lib/attestation";

/**
 * Honest trust card: what is verifiable about this deployment today, and what
 * is not yet. Replaces the earlier hard-coded "ZK Attested / Trust 97" badge,
 * which described a planned attestation flow as if it were live.
 */
export default function ProgramCard({ activeNodes }: { activeNodes: number }) {
  const [expanded, setExpanded] = useState(false);
  const [locked, setLocked] = useState<boolean | null>(null);
  const [info, setInfo] = useState<ProgramInfo | null>(null);
  const [att, setAtt] = useState<AttestationInfo | null | undefined>(undefined);
  const [attCfg, setAttCfg] = useState<AttestationConfigInfo | null>(null);
  const [nowSec, setNowSec] = useState<number>(0);
  const id = PROGRAM_ID.toBase58();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const conn = getConnection();
      // Small reads first; the ProgramData read (hundreds of KB) last and retried,
      // so a rate-limited public RPC does not blank the whole card.
      const [l, a, c] = await Promise.all([
        fetchConfigLocked(conn).catch(() => null),
        fetchAttestation(conn, PROGRAM_ID).catch(() => null),
        fetchAttestationConfig(conn).catch(() => null),
      ]);
      if (!cancelled) { setLocked(l); setAtt(a); setAttCfg(c); setNowSec(Date.now() / 1000); }
      const i = await fetchProgramInfo(conn);
      if (!cancelled) setInfo(i);
    })();
    return () => { cancelled = true; };
  }, []);

  const attExpired = att && nowSec > 0 ? att.expiresAt < nowSec : false;
  const liveHash = info?.bytecodeSha256 ?? null;
  const hashMatches = att && liveHash ? att.programHash === liveHash : null;
  const attLabel =
    att === undefined ? "reading…"
    : att === null ? "none for this program"
    : !att.valid ? "invalidated"
    : attExpired ? `expired (slot ${att.slot.toLocaleString()})`
    : `by ${att.signerCount} PRUV node${att.signerCount === 1 ? "" : "s"} · slot ${att.slot.toLocaleString()}`;
  const hashLabel =
    att == null ? "—"
    : liveHash === null ? `${att.programHash.slice(0, 10)}… (live hash unavailable)`
    : hashMatches ? `${att.programHash.slice(0, 10)}… = running bytecode ✓`
    : `${att.programHash.slice(0, 10)}… ≠ running ${liveHash.slice(0, 10)}…`;
  const zkLabel =
    att == null ? "—"
    : attCfg?.verifierProgram
      ? `verified on-chain by ${shortenAddress(attCfg.verifierProgram, 4)} (Halo2, no Groth16)`
      : "proof hash recorded; on-chain verification pending verifier deployment";

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
          <div className="pt-2 mt-2" style={{ borderTop: "1px solid var(--border-soft)" }}>
            <p className="mb-2" style={{ color: "var(--text-secondary)" }}>PRUV attestation of this program</p>
            <Row
              label="Attestation"
              value={attLabel}
              href={att ? `https://explorer.solana.com/address/${att.address}?cluster=devnet` : undefined}
            />
            <Row label="Attested hash" value={hashLabel} />
            <Row
              label="ZK proof"
              value={zkLabel}
              href={attCfg?.verifierProgram ? `https://explorer.solana.com/address/${attCfg.verifierProgram}?cluster=devnet` : undefined}
            />
          </div>
          <p className="mt-3 text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
            Everything above can be checked from public chain data (see “Verify this round yourself”).
            The operator cannot choose a winner; what it can still do is listed honestly above: change
            config until it is locked, and upgrade the program while an upgrade authority exists.
            The attestation is written by a PRUV node after it fetched this program’s bytecode, hashed it
            (compare with the hash this page computes from the chain) and produced a Halo2 proof of the
            commitment; when the on-chain verifier is configured, the attestation program only accepts an
            attestation whose proof was verified on Solana first.
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
