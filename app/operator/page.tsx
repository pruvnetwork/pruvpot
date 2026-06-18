"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/Toast";
import {
  OPERATOR_NODES,
  OPERATOR_EARNINGS,
  getOperatorLog,
  addOperatorLog,
  type OperatorNode,
  type OperatorLogEntry,
} from "@/lib/adminMock";
import { getMockRound, getMockVotes } from "@/lib/mock";

const NODE_KEY = "pruv-node-2024";

function fmtLamports(l: bigint) {
  return (Number(l) / 1e9).toFixed(3) + " SOL";
}

function timeAgo(ms: number) {
  const s = Math.floor((Date.now() - ms) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

// ── Auth Gate ─────────────────────────────────────────────────────────────────
function AuthGate({ onAuth }: { onAuth: (node: OperatorNode) => void }) {
  const [key, setKey] = useState("");
  const [selected, setSelected] = useState(0);
  const [err, setErr] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (key === NODE_KEY) {
      onAuth(OPERATOR_NODES[selected]);
    } else {
      setErr(true);
      setTimeout(() => setErr(false), 1500);
    }
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="w-12 h-12 bg-sky-700 rounded-xl mx-auto flex items-center justify-center text-2xl mb-4">
            ⬡
          </div>
          <h1 className="text-xl font-bold text-white">Node Operator Portal</h1>
          <p className="text-zinc-500 text-sm mt-1">PRUV Network — devnet</p>
        </div>

        <form onSubmit={submit} className="space-y-3">
          {/* Node selector */}
          <div className="space-y-2">
            <p className="text-xs text-zinc-500">Select your node</p>
            {OPERATOR_NODES.map((n, i) => (
              <button
                key={n.pubkey}
                type="button"
                onClick={() => setSelected(i)}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-colors",
                  selected === i
                    ? "border-sky-600 bg-sky-950/30 text-sky-300"
                    : "border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700"
                )}
              >
                <span className={cn(
                  "w-2 h-2 rounded-full shrink-0",
                  n.active ? "bg-emerald-400" : "bg-zinc-600"
                )} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-mono truncate">{n.pubkey}</p>
                  <p className="text-xs text-zinc-600 mt-0.5">{n.stakePruv.toLocaleString()} PRUV staked · rep {n.reputation}</p>
                </div>
                {selected === i && (
                  <span className="text-sky-400 text-xs shrink-0">selected</span>
                )}
              </button>
            ))}
          </div>

          <input
            type="password"
            value={key}
            onChange={e => setKey(e.target.value)}
            placeholder="Operator key"
            className={cn(
              "w-full bg-zinc-900 border rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 outline-none transition-colors",
              err ? "border-red-600 animate-[shake_0.3s_ease]" : "border-zinc-700 focus:border-sky-600"
            )}
          />
          <button
            type="submit"
            className="w-full bg-sky-700 hover:bg-sky-600 active:scale-[0.98] text-white py-3 rounded-xl font-semibold transition-all"
          >
            Enter Portal
          </button>
        </form>

        <p className="text-center text-xs text-zinc-700">
          hint: <span className="font-mono text-zinc-600">{NODE_KEY}</span>
        </p>
      </div>
    </div>
  );
}

// ── Main Operator Page ────────────────────────────────────────────────────────
export default function OperatorPage() {
  const [node, setNode] = useState<OperatorNode | null>(null);
  const [round, setRound] = useState(getMockRound());
  const [votes, setVotes] = useState(getMockVotes());
  const [log, setLog] = useState<OperatorLogEntry[]>([]);
  const [hasVoted, setHasVoted] = useState(false);
  const [hasClaimed, setHasClaimed] = useState(false);
  const { promise, toast } = useToast();

  useEffect(() => {
    if (!node) return;
    setLog(getOperatorLog());
    const id = setInterval(() => {
      setRound(getMockRound());
      setVotes(getMockVotes());
    }, 1000);
    return () => clearInterval(id);
  }, [node]);

  // Reset vote/claim flags when round changes
  useEffect(() => {
    setHasVoted(false);
    setHasClaimed(false);
  }, [round.roundId]);

  function refreshLog() { setLog(getOperatorLog()); }

  async function simulate(action: string, detail: string, delay = 1400) {
    await new Promise(r => setTimeout(r, delay));
    const sig = `${Math.random().toString(36).slice(2, 5)}...${Math.random().toString(36).slice(2, 5)}`;
    addOperatorLog({ action, detail, status: "success", txSig: sig });
    refreshLog();
    return sig;
  }

  async function handleVote() {
    if (!node) return;
    // Derive winner index (mock XOR-fold)
    const winnerIndex = Number(round.ticketCount) > 0
      ? Math.floor(Math.random() * Number(round.ticketCount))
      : 0;

    await promise(
      simulate("cast_draw_vote", `Round #${round.roundId} · winnerIndex=${winnerIndex} · sig verified`),
      {
        loading: "Computing SlotHash XOR fold…",
        success: `Vote cast · winner index ${winnerIndex}`,
        error: "Vote failed",
      }
    );
    setHasVoted(true);
  }

  async function handleClaim() {
    if (!node) return;
    const share = (Number(round.prizePoolLamports) / 1e9 * 0.15 / 3).toFixed(4);
    await promise(
      simulate("claim_node_prize", `Round #${round.roundId} · +${share} SOL`),
      {
        loading: "Claiming node prize…",
        success: `+${share} SOL claimed!`,
        error: "Claim failed",
      }
    );
    setHasClaimed(true);
  }

  const totalEarned = OPERATOR_EARNINGS.reduce((a, e) => a + e.shareSOL, 0);
  const myVote = votes.find(v => v.nodePubkey === node?.pubkey);
  const allVoted = votes.length;
  const threshold = Math.ceil(round.activeNodeCount * 2 / 3);

  if (!node) return <AuthGate onAuth={setNode} />;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <span className="text-sky-400">⬡</span>
            Node Operator Portal
          </h1>
          <p className="font-mono text-zinc-500 text-sm mt-0.5">{node.pubkey}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn(
            "flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border",
            node.active
              ? "bg-emerald-950/40 border-emerald-800 text-emerald-400"
              : "bg-zinc-900 border-zinc-700 text-zinc-500"
          )}>
            <span className={cn("w-1.5 h-1.5 rounded-full", node.active ? "bg-emerald-400 animate-pulse" : "bg-zinc-600")} />
            {node.active ? "Online" : "Offline"}
          </span>
          <button
            onClick={() => setNode(null)}
            className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            Switch node
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left — actions */}
        <div className="lg:col-span-2 space-y-5">

          {/* Active Round Panel */}
          <div className="border border-zinc-800 bg-zinc-900/50 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                <span>🗳️</span> Current Round
              </h2>
              <span className={cn(
                "text-xs px-2.5 py-1 rounded-full border",
                round.status === 0 ? "bg-emerald-950/40 border-emerald-800 text-emerald-400" :
                round.status === 1 ? "bg-yellow-950/40 border-yellow-800 text-yellow-400" :
                                     "bg-zinc-800 border-zinc-700 text-zinc-500"
              )}>
                {round.status === 0 ? "Open" : round.status === 1 ? "Committing" : "Closed"}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Stat label="Round" value={`#${round.roundId}`} mono />
              <Stat label="Tickets" value={round.ticketCount.toString()} />
              <Stat label="Prize Pool" value={fmtLamports(round.prizePoolLamports)} accent />
            </div>

            {/* Vote consensus progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-500">Consensus progress</span>
                <span className="text-zinc-400">{allVoted}/{round.activeNodeCount} voted · threshold {threshold}</span>
              </div>
              <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    allVoted >= threshold ? "bg-emerald-500" : "bg-violet-600"
                  )}
                  style={{ width: `${Math.min((allVoted / round.activeNodeCount) * 100, 100)}%` }}
                />
              </div>
              {votes.map(v => (
                <div key={v.nodePubkey} className="flex items-center gap-2 text-xs text-zinc-500">
                  <span className="text-emerald-400">✓</span>
                  <span className="font-mono">{v.nodePubkey}</span>
                  <span className="ml-auto text-zinc-600">{timeAgo(v.votedAt)}</span>
                </div>
              ))}
            </div>

            {/* cast_draw_vote */}
            <div className={cn(
              "rounded-xl border p-4 space-y-3 transition-colors",
              round.status === 1 && !hasVoted
                ? "border-yellow-800 bg-yellow-950/10"
                : "border-zinc-800 bg-zinc-800/20"
            )}>
              <div>
                <p className="text-sm font-semibold text-zinc-200">cast_draw_vote</p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Read on-chain SlotHash → XOR-fold → derive winner index → sign and submit
                </p>
              </div>

              {round.status === 0 && (
                <p className="text-xs text-zinc-600">Waiting for round to close before voting…</p>
              )}

              {round.status === 1 && (
                hasVoted || myVote ? (
                  <div className="flex items-center gap-2 text-xs text-emerald-400">
                    <span>✓</span>
                    <span>Vote submitted for this round</span>
                  </div>
                ) : (
                  <button
                    onClick={handleVote}
                    className="w-full py-2.5 rounded-lg bg-yellow-700 hover:bg-yellow-600 active:scale-[0.98] text-white text-sm font-semibold transition-all"
                  >
                    Derive & Cast Vote
                  </button>
                )
              )}

              {round.status === 2 && (
                <p className="text-xs text-zinc-600">Round finalized — winner: <span className="font-mono text-emerald-400">{round.winner}</span></p>
              )}
            </div>

            {/* claim_node_prize */}
            <div className={cn(
              "rounded-xl border p-4 space-y-3 transition-colors",
              round.status === 2 && !hasClaimed
                ? "border-sky-800 bg-sky-950/10"
                : "border-zinc-800 bg-zinc-800/20"
            )}>
              <div>
                <p className="text-sm font-semibold text-zinc-200">claim_node_prize</p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Claim your share of the 15% node pool — proportional to your stake weight
                </p>
              </div>

              {round.status !== 2 && (
                <p className="text-xs text-zinc-600">Available after draw is finalized</p>
              )}

              {round.status === 2 && (
                hasClaimed ? (
                  <div className="flex items-center gap-2 text-xs text-emerald-400">
                    <span>✓</span>
                    <span>Prize claimed for this round</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-500">Your estimated share</span>
                      <span className="text-emerald-400 font-semibold">
                        +{(Number(round.prizePoolLamports) / 1e9 * 0.15 / 3).toFixed(4)} SOL
                      </span>
                    </div>
                    <button
                      onClick={handleClaim}
                      className="w-full py-2.5 rounded-lg bg-sky-700 hover:bg-sky-600 active:scale-[0.98] text-white text-sm font-semibold transition-all"
                    >
                      Claim Node Prize
                    </button>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Activity Log */}
          <div className="border border-zinc-800 bg-zinc-900/50 rounded-xl p-5 space-y-3">
            <h2 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
              <span>📋</span> Activity Log
            </h2>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {log.map(e => (
                <div key={e.id} className="flex items-start gap-3 text-xs">
                  <span className={cn(
                    "mt-1 w-1.5 h-1.5 rounded-full shrink-0",
                    e.status === "success" ? "bg-emerald-400" : "bg-red-400"
                  )} />
                  <div className="flex-1 min-w-0">
                    <span className="font-mono text-sky-400">{e.action}</span>
                    <span className="text-zinc-500"> · {e.detail}</span>
                    {e.txSig && (
                      <a
                        href={`https://explorer.solana.com/tx/${e.txSig}?cluster=devnet`}
                        target="_blank" rel="noopener noreferrer"
                        className="ml-2 text-sky-700 hover:text-sky-500"
                      >
                        {e.txSig} ↗
                      </a>
                    )}
                  </div>
                  <span className="text-zinc-700 shrink-0">{timeAgo(e.at)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Earnings History */}
          <div className="border border-zinc-800 bg-zinc-900/50 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
              <h2 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                <span>💰</span> Earnings History
              </h2>
              <span className="text-xs text-emerald-400 font-semibold">
                +{totalEarned.toFixed(4)} SOL total
              </span>
            </div>
            <div className="divide-y divide-zinc-800/50">
              {OPERATOR_EARNINGS.map(e => (
                <div key={e.roundId} className="flex items-center gap-4 px-5 py-3 text-sm hover:bg-zinc-800/20 transition-colors">
                  <span className="font-mono text-zinc-500 w-12">#{e.roundId}</span>
                  <span className="text-zinc-500 text-xs flex-1">Pool: {e.prizePoolSOL.toFixed(3)} SOL</span>
                  <span className="text-emerald-400 font-semibold">+{e.shareSOL.toFixed(4)} SOL</span>
                  <span className="text-zinc-700 text-xs hidden sm:block">{timeAgo(e.paidAt)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right — node stats */}
        <div className="space-y-4">

          {/* Node identity */}
          <div className="border border-sky-900/50 bg-sky-950/10 rounded-xl p-4 space-y-3">
            <p className="text-xs text-zinc-500 uppercase tracking-widest">Your Node</p>
            <div className="space-y-2 text-sm">
              <Row label="Pubkey" value={node.pubkey} mono />
              <Row label="Stake" value={`${node.stakePruv.toLocaleString()} PRUV`} />
              <Row label="Reputation" value={`${node.reputation}/100`} accent />
              <Row label="Uptime" value={node.uptime} />
              <Row label="Attestations" value={node.totalAttestations.toLocaleString()} />
            </div>
          </div>

          {/* Stake weight */}
          <div className="border border-zinc-800 bg-zinc-900/50 rounded-xl p-4 space-y-3">
            <p className="text-xs text-zinc-500 uppercase tracking-widest">Stake Weight</p>
            <div className="space-y-2">
              {OPERATOR_NODES.map(n => {
                const totalStake = OPERATOR_NODES.reduce((a, x) => a + x.stakePruv, 0);
                const pct = (n.stakePruv / totalStake) * 100;
                const isMe = n.pubkey === node.pubkey;
                return (
                  <div key={n.pubkey}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className={cn("font-mono", isMe ? "text-sky-400" : "text-zinc-500")}>
                        {n.pubkey} {isMe && "(you)"}
                      </span>
                      <span className="text-zinc-500">{pct.toFixed(1)}%</span>
                    </div>
                    <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full", isMe ? "bg-sky-500" : "bg-zinc-600")}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              <p className="text-xs text-zinc-600 pt-1">
                Prize share proportional to stake weight
              </p>
            </div>
          </div>

          {/* Rewards summary */}
          <div className="border border-zinc-800 bg-zinc-900/50 rounded-xl p-4 space-y-2 text-sm">
            <p className="text-xs text-zinc-500 uppercase tracking-widest mb-3">Rewards</p>
            <Row label="Last 10 rounds" value={`${totalEarned.toFixed(4)} SOL`} accent />
            <Row label="Avg per round" value={`${(totalEarned / OPERATOR_EARNINGS.length).toFixed(4)} SOL`} />
            <Row label="Rounds voted" value={OPERATOR_EARNINGS.length.toString()} />
            <Row
              label="Est. monthly"
              value={`${(totalEarned / OPERATOR_EARNINGS.length * 30).toFixed(3)} SOL`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, mono, accent }: { label: string; value: string; mono?: boolean; accent?: boolean }) {
  return (
    <div className="bg-zinc-800/40 rounded-lg p-3">
      <p className="text-xs text-zinc-500 mb-1">{label}</p>
      <p className={cn("text-base font-semibold", accent ? "text-emerald-400" : "text-white", mono && "font-mono")}>{value}</p>
    </div>
  );
}

function Row({ label, value, mono, accent }: { label: string; value: string; mono?: boolean; accent?: boolean }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-zinc-600 text-xs">{label}</span>
      <span className={cn("text-xs font-medium", accent ? "text-emerald-400" : "text-zinc-300", mono && "font-mono")}>{value}</span>
    </div>
  );
}
