"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/Toast";
import {
  MOCK_CONFIG,
  MOCK_TREASURY,
  MOCK_NODES_ADMIN,
  getAdminLog,
  addAdminLog,
  type AdminLogEntry,
} from "@/lib/adminMock";
import { getMockRound } from "@/lib/mock";

const OPERATOR_KEY = "pruv-admin-2024";

function fmtLamports(l: bigint) {
  return (Number(l) / 1e9).toFixed(3) + " SOL";
}

function timeAgo(ms: number) {
  const s = Math.floor((Date.now() - ms) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

// ── Auth Gate ──────────────────────────────────────────────────────────────────
function AuthGate({ onAuth }: { onAuth: () => void }) {
  const [val, setVal] = useState("");
  const [err, setErr] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (val === OPERATOR_KEY) { onAuth(); }
    else { setErr(true); setTimeout(() => setErr(false), 1500); }
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="w-12 h-12 bg-violet-600 rounded-xl mx-auto flex items-center justify-center text-xl font-bold mb-4">
            🔑
          </div>
          <h1 className="text-xl font-bold text-white">Operator Access</h1>
          <p className="text-zinc-500 text-sm mt-1">PRUVPOT Admin Panel</p>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <input
            type="password"
            value={val}
            onChange={e => setVal(e.target.value)}
            placeholder="Operator key"
            autoFocus
            className={cn(
              "w-full bg-zinc-900 border rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 outline-none transition-colors",
              err ? "border-red-600 animate-[shake_0.3s_ease]" : "border-zinc-700 focus:border-violet-600"
            )}
          />
          <button
            type="submit"
            className="w-full bg-violet-600 hover:bg-violet-500 active:scale-[0.98] text-white py-3 rounded-xl font-semibold transition-all"
          >
            Enter Panel
          </button>
        </form>

        <p className="text-center text-xs text-zinc-700">
          hint: <span className="font-mono text-zinc-600">{OPERATOR_KEY}</span>
        </p>
      </div>
    </div>
  );
}

// ── Instruction Button ─────────────────────────────────────────────────────────
function IxButton({
  label, description, variant = "default", disabled, onClick,
}: {
  label: string;
  description: string;
  variant?: "default" | "warning" | "danger" | "success";
  disabled?: boolean;
  onClick: () => void;
}) {
  const [busy, setBusy] = useState(false);

  async function handle() {
    if (busy || disabled) return;
    setBusy(true);
    await onClick();
    setBusy(false);
  }

  const colors = {
    default: "bg-violet-600 hover:bg-violet-500 text-white",
    warning: "bg-yellow-700 hover:bg-yellow-600 text-white",
    danger:  "bg-red-700 hover:bg-red-600 text-white",
    success: "bg-emerald-700 hover:bg-emerald-600 text-white",
  };

  return (
    <div className="flex items-center justify-between gap-4 p-4 bg-zinc-800/40 rounded-xl">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-zinc-200">{label}</p>
        <p className="text-xs text-zinc-500 mt-0.5">{description}</p>
      </div>
      <button
        onClick={handle}
        disabled={disabled || busy}
        className={cn(
          "shrink-0 text-xs px-4 py-2 rounded-lg font-semibold transition-all active:scale-95",
          disabled ? "bg-zinc-700 text-zinc-500 cursor-not-allowed" : colors[variant],
          busy && "opacity-70 cursor-wait"
        )}
      >
        {busy ? (
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full inline-block" style={{ animation: "spin 0.7s linear infinite" }} />
            Sending…
          </span>
        ) : label.split("·")[0].trim()}
      </button>
    </div>
  );
}

// ── Main Admin Page ────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [log, setLog] = useState<AdminLogEntry[]>([]);
  const [round, setRound] = useState(getMockRound());
  const [config, setConfig] = useState(MOCK_CONFIG);
  const [editBps, setEditBps] = useState(false);
  const [bpsForm, setBpsForm] = useState({
    winner: MOCK_CONFIG.winnerBps,
    node: MOCK_CONFIG.nodeBps,
    treasury: MOCK_CONFIG.treasuryBps,
  });
  const { toast, promise } = useToast();

  useEffect(() => {
    if (!authed) return;
    setLog(getAdminLog());
    const id = setInterval(() => setRound(getMockRound()), 1000);
    return () => clearInterval(id);
  }, [authed]);

  function refreshLog() { setLog(getAdminLog()); }

  async function simulate(action: string, detail: string, delay = 1200) {
    await new Promise(r => setTimeout(r, delay));
    const sig = `${Math.random().toString(36).slice(2,6)}...${Math.random().toString(36).slice(2,4)}`;
    addAdminLog({ action, detail, status: "success", txSig: sig });
    refreshLog();
    return sig;
  }

  async function handleInitConfig() {
    await promise(simulate("init_config", "Config initialized on-chain"), {
      loading: "Sending init_config…",
      success: "Config initialized!",
      error: "Transaction failed",
    });
  }

  async function handleUpdateNodeCount() {
    await promise(simulate("update_node_count", `Node count set to ${config.nodeCount}`), {
      loading: "Sending update_node_count…",
      success: "Node count updated!",
      error: "Transaction failed",
    });
  }

  async function handleInitRound() {
    await promise(simulate("initialize_round", `Round #${Number(round.roundId) + 1} opened`), {
      loading: "Opening new round…",
      success: `Round #${Number(round.roundId) + 1} initialized!`,
      error: "Transaction failed",
    });
  }

  async function handleFinalize() {
    await promise(simulate("finalize_draw", `Round #${round.roundId} finalized`, 1800), {
      loading: "Finalizing draw…",
      success: "Draw finalized — winner selected!",
      error: "Finalization failed",
    });
  }

  async function saveBps() {
    const total = bpsForm.winner + bpsForm.node + bpsForm.treasury;
    if (total !== 10000) {
      toast(`BPS must sum to 10,000 (currently ${total})`, "error");
      return;
    }
    await promise(
      simulate("update_config", `BPS: ${bpsForm.winner}/${bpsForm.node}/${bpsForm.treasury}`),
      { loading: "Updating config…", success: "Config updated!", error: "Failed" }
    );
    setConfig(c => ({ ...c, winnerBps: bpsForm.winner, nodeBps: bpsForm.node, treasuryBps: bpsForm.treasury }));
    setEditBps(false);
  }

  if (!authed) return <AuthGate onAuth={() => setAuthed(true)} />;

  const treasury = MOCK_TREASURY;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <span>Admin Panel</span>
            <span className="text-xs bg-red-900/60 border border-red-800 text-red-400 px-2 py-0.5 rounded-full font-normal">
              Operator Only
            </span>
          </h1>
          <p className="text-zinc-500 text-sm mt-0.5">
            {config.authority} · devnet
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-500 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2">
          <span className={cn(
            "w-1.5 h-1.5 rounded-full",
            round.status === 0 ? "bg-emerald-400 animate-pulse" :
            round.status === 1 ? "bg-yellow-400 animate-pulse" : "bg-zinc-500"
          )} />
          Round #{round.roundId.toString()} ·{" "}
          {round.status === 0 ? "Open" : round.status === 1 ? "Drawing" : "Closed"}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left — controls */}
        <div className="lg:col-span-2 space-y-5">

          {/* Round Controls */}
          <Section title="Round Instructions" icon="▶">
            <IxButton
              label="initialize_round · Open new round"
              description="Creates a new lottery round PDA with configured slot window"
              variant="success"
              disabled={round.status === 0}
              onClick={handleInitRound}
            />
            <IxButton
              label="finalize_draw · Settle winner"
              description="Calls finalize_draw after 2/3 node threshold is reached — transfers prize via CPI"
              variant="warning"
              disabled={round.status !== 1}
              onClick={handleFinalize}
            />
            <div className="flex items-center gap-3 p-4 bg-zinc-800/20 rounded-xl border border-zinc-800/50">
              <span className="text-zinc-600 text-xl">⬡</span>
              <div>
                <p className="text-sm text-zinc-500">cast_draw_vote & claim_node_prize</p>
                <p className="text-xs text-zinc-700 mt-0.5">
                  Node operator instructions — managed in the{" "}
                  <a href="/operator" className="text-sky-600 hover:text-sky-400 underline">
                    Node Operator Portal
                  </a>
                </p>
              </div>
            </div>
          </Section>

          {/* Config Controls */}
          <Section title="Config Instructions" icon="⚙">
            <IxButton
              label="init_config · Initialize program"
              description="One-time setup of LotteryConfig PDA — only callable by authority"
              variant="danger"
              disabled={config.isInitialized}
              onClick={handleInitConfig}
            />
            <IxButton
              label="update_node_count · Sync operators"
              description={`Current: ${config.nodeCount} nodes · Reads from NodeRegistry PDA`}
              onClick={handleUpdateNodeCount}
            />

            {/* BPS Editor */}
            <div className="p-4 bg-zinc-800/40 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-zinc-200">Prize Split (BPS)</p>
                  <p className="text-xs text-zinc-500 mt-0.5">Must sum to 10,000</p>
                </div>
                <button
                  onClick={() => setEditBps(!editBps)}
                  className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
                >
                  {editBps ? "Cancel" : "Edit"}
                </button>
              </div>

              {editBps ? (
                <div className="space-y-2">
                  {(["winner","node","treasury"] as const).map(key => (
                    <div key={key} className="flex items-center gap-3">
                      <label className="text-xs text-zinc-500 w-20 capitalize">{key}</label>
                      <input
                        type="number"
                        min={0}
                        max={10000}
                        value={bpsForm[key]}
                        onChange={e => setBpsForm(f => ({ ...f, [key]: Number(e.target.value) }))}
                        className="flex-1 bg-zinc-900 border border-zinc-700 focus:border-violet-600 rounded-lg px-3 py-1.5 text-sm text-white outline-none"
                      />
                      <span className="text-xs text-zinc-600 w-12">{(bpsForm[key] / 100).toFixed(1)}%</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between pt-1">
                    <span className={cn(
                      "text-xs",
                      bpsForm.winner + bpsForm.node + bpsForm.treasury === 10000
                        ? "text-emerald-500" : "text-red-500"
                    )}>
                      Total: {bpsForm.winner + bpsForm.node + bpsForm.treasury} / 10,000
                    </span>
                    <button
                      onClick={saveBps}
                      className="text-xs bg-violet-600 hover:bg-violet-500 text-white px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Save & Send tx
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-3">
                  <BpsPill label="Winner" bps={config.winnerBps} color="emerald" />
                  <BpsPill label="Nodes"  bps={config.nodeBps}   color="sky" />
                  <BpsPill label="Treasury" bps={config.treasuryBps} color="violet" />
                </div>
              )}
            </div>
          </Section>

          {/* Activity Log */}
          <Section title="Activity Log" icon="📋">
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {log.map(e => (
                <div key={e.id} className="flex items-start gap-3 text-xs">
                  <span className={cn(
                    "mt-0.5 w-1.5 h-1.5 rounded-full shrink-0",
                    e.status === "success" ? "bg-emerald-400" :
                    e.status === "error"   ? "bg-red-400" : "bg-yellow-400"
                  )} />
                  <div className="flex-1 min-w-0">
                    <span className="font-mono text-violet-400">{e.action}</span>
                    <span className="text-zinc-500"> · {e.detail}</span>
                    {e.txSig && (
                      <a
                        href={`https://explorer.solana.com/tx/${e.txSig}?cluster=devnet`}
                        target="_blank" rel="noopener noreferrer"
                        className="ml-2 text-sky-600 hover:text-sky-400"
                      >
                        {e.txSig} ↗
                      </a>
                    )}
                  </div>
                  <span className="text-zinc-700 shrink-0">{timeAgo(e.at)}</span>
                </div>
              ))}
            </div>
          </Section>
        </div>

        {/* Right — stats */}
        <div className="space-y-4">

          {/* Treasury */}
          <div className="border border-zinc-800 bg-zinc-900/50 rounded-xl p-4 space-y-3">
            <p className="text-xs text-zinc-500 uppercase tracking-widest">Treasury</p>
            <p className="text-2xl font-bold text-white">{fmtLamports(treasury.balanceLamports)}</p>
            <div className="text-xs text-zinc-600 space-y-1">
              <div className="flex justify-between">
                <span>All-time collected</span>
                <span className="text-zinc-400">{fmtLamports(treasury.allTimeCollectedLamports)}</span>
              </div>
              <div className="flex justify-between">
                <span>Rate (5%)</span>
                <span className="text-zinc-400">{config.treasuryBps / 100}% per round</span>
              </div>
            </div>
            <div className="text-xs text-zinc-600 border-t border-zinc-800 pt-2">
              <span className="font-mono text-zinc-500">{config.treasury}</span>
            </div>
          </div>

          {/* Live round stats */}
          <div className="border border-zinc-800 bg-zinc-900/50 rounded-xl p-4 space-y-3">
            <p className="text-xs text-zinc-500 uppercase tracking-widest">Current Round</p>
            <div className="space-y-2 text-sm">
              <Row label="Round ID" value={`#${round.roundId}`} mono />
              <Row label="Tickets" value={round.ticketCount.toString()} />
              <Row label="Prize Pool" value={fmtLamports(round.prizePoolLamports)} accent />
              <Row label="Votes" value={`${round.voteCount}/${round.activeNodeCount}`} />
              <Row label="Threshold" value={`${round.thresholdBps}bps`} mono />
            </div>
          </div>

          {/* Nodes */}
          <div className="border border-zinc-800 bg-zinc-900/50 rounded-xl p-4 space-y-3">
            <p className="text-xs text-zinc-500 uppercase tracking-widest">Nodes ({MOCK_NODES_ADMIN.length})</p>
            {MOCK_NODES_ADMIN.map((n, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span className={cn(
                  "w-1.5 h-1.5 rounded-full shrink-0",
                  n.active ? "bg-emerald-400" : "bg-zinc-600"
                )} />
                <span className="font-mono text-zinc-400 flex-1 truncate">{n.pubkey}</span>
                <span className="text-zinc-600 shrink-0">{n.uptime}</span>
              </div>
            ))}
          </div>

          {/* Config summary */}
          <div className="border border-zinc-800 bg-zinc-900/50 rounded-xl p-4 space-y-2 text-xs">
            <p className="text-zinc-500 uppercase tracking-widest mb-2">Config</p>
            <Row label="Ticket Price" value={fmtLamports(config.ticketPriceLamports)} />
            <Row label="Round Duration" value={`${config.roundDurationSlots.toLocaleString()} slots`} />
            <Row label="Rounds Run" value={config.totalRoundsRun.toString()} />
            <Row label="Total Volume" value={fmtLamports(config.totalVolumeLamports)} accent />
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="border border-zinc-800 bg-zinc-900/50 rounded-xl p-5 space-y-3">
      <h2 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
        <span>{icon}</span> {title}
      </h2>
      {children}
    </div>
  );
}

function BpsPill({ label, bps, color }: { label: string; bps: number; color: "emerald" | "sky" | "violet" }) {
  const c = {
    emerald: "bg-emerald-950 border-emerald-800 text-emerald-300",
    sky:     "bg-sky-950 border-sky-800 text-sky-300",
    violet:  "bg-violet-950 border-violet-800 text-violet-300",
  }[color];
  return (
    <div className={cn("flex-1 border rounded-lg px-2 py-1.5 text-center text-xs", c)}>
      <p className="text-zinc-500 text-[10px]">{label}</p>
      <p className="font-semibold">{bps / 100}%</p>
    </div>
  );
}

function Row({ label, value, mono, accent }: { label: string; value: string; mono?: boolean; accent?: boolean }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-zinc-600">{label}</span>
      <span className={cn(
        "font-medium",
        accent ? "text-emerald-400" : "text-zinc-300",
        mono && "font-mono"
      )}>{value}</span>
    </div>
  );
}
