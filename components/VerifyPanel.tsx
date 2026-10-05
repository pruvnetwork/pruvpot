"use client";

import { useState } from "react";
import { getConnection } from "@/lib/rpc";
import { verifyRound, type VerifyReport, type StepStatus } from "@/lib/verify";

interface Props {
  roundId: bigint;
  endSlot?: bigint;
  ticketCount?: bigint;
  /** Start expanded (used on the round detail page). */
  defaultOpen?: boolean;
}

const ICON: Record<StepStatus, string> = { ok: "✓", fail: "✗", pending: "…", info: "i" };
const COLOR: Record<StepStatus, string> = {
  ok: "var(--success-color)",
  fail: "var(--danger-color)",
  pending: "var(--text-muted)",
  info: "var(--blue-primary)",
};

export default function VerifyPanel({ roundId, endSlot, ticketCount, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const [report, setReport] = useState<VerifyReport | null>(null);
  const [running, setRunning] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function run() {
    setRunning(true);
    setErr(null);
    try {
      setReport(await verifyRound(getConnection(), roundId));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "verification failed");
    } finally {
      setRunning(false);
    }
  }

  const verdictLabel =
    report?.verdict === "verified"
      ? "Verified from chain data"
      : report?.verdict === "mismatch"
      ? "MISMATCH — do not trust this round"
      : "Not final yet";

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
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between">
        <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          Verify this round yourself
        </span>
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="mt-4 space-y-3 text-xs font-mono">
          <div className="rounded-lg p-3 space-y-1" style={{ background: "var(--surface-tertiary)", border: "1px solid var(--border-soft)" }}>
            <p style={{ color: "var(--text-secondary)" }}>Winner rule (identical on-chain and here):</p>
            <p style={{ color: "var(--purple-primary)" }}>h[i] = SlotHashes[end_slot + i], i = 0..8 (zero if the slot was skipped)</p>
            <p style={{ color: "var(--purple-primary)" }}>seed = Poseidon_BN254(h[0..8] with byte 31 cleared, roundId, ticketCount)</p>
            <p style={{ color: "var(--purple-primary)" }}>winner = u64_LE(seed[0..8]) % ticketCount</p>
          </div>

          <div className="rounded-lg p-3 space-y-1" style={{ background: "var(--surface-secondary)", border: "1px solid var(--border-default)" }}>
            <p style={{ color: "var(--text-secondary)" }}>Round #{roundId.toString()} inputs</p>
            {endSlot !== undefined && <p style={{ color: "var(--text-muted)" }}>End slot: {endSlot.toLocaleString()}</p>}
            {ticketCount !== undefined && <p style={{ color: "var(--text-muted)" }}>Ticket count: {ticketCount.toString()}</p>}
            <p style={{ color: "var(--text-muted)" }}>Seed: stored in the round account; inputs read from the SlotHashes sysvar or the vote transaction log</p>
          </div>

          <button
            onClick={run}
            disabled={running}
            className="w-full rounded-lg py-2.5 text-xs font-semibold transition-opacity disabled:opacity-60"
            style={{ background: "var(--purple-primary)", color: "#fff" }}
          >
            {running ? "Reading chain…" : report ? "Re-run verification" : `Verify round #${roundId.toString()} now`}
          </button>

          {err && (
            <p className="rounded-lg p-2" style={{ color: "var(--danger-color)", background: "rgba(225,29,72,0.06)" }}>
              {err}
            </p>
          )}

          {report && (
            <div className="space-y-2">
              <p
                className="font-semibold"
                style={{
                  color:
                    report.verdict === "verified"
                      ? "var(--success-color)"
                      : report.verdict === "mismatch"
                      ? "var(--danger-color)"
                      : "var(--text-secondary)",
                }}
              >
                {verdictLabel}
              </p>
              <ol className="space-y-2">
                {report.steps.map((s, i) => (
                  <li key={i} className="flex gap-2">
                    <span
                      className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold"
                      style={{ border: `1px solid ${COLOR[s.status]}`, color: COLOR[s.status] }}
                    >
                      {ICON[s.status]}
                    </span>
                    <div className="min-w-0">
                      <p style={{ color: "var(--text-primary)" }}>{s.title}</p>
                      {s.detail && (
                        <p className="break-all" style={{ color: "var(--text-muted)" }}>
                          {s.detail}
                        </p>
                      )}
                      {s.link && (
                        <a
                          href={s.link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: "var(--blue-primary)" }}
                        >
                          {s.link.label} ↗
                        </a>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}

          <p className="leading-relaxed" style={{ color: "var(--text-muted)" }}>
            The seed is a Poseidon hash of the eight Solana slot hashes that follow the round&apos;s end slot, fixed when
            the round opened and produced only after ticket sales closed. The program reads them from the SlotHashes
            sysvar itself and rejects any node vote that disagrees, so no operator, node or buyer picks the number.
            It is not VRF-grade randomness: the leader of the last block in the window can choose among the few block
            variants it can build in one slot. Finalization needs ≥ 2/3 of the registered nodes to agree.
          </p>
        </div>
      )}
    </div>
  );
}
