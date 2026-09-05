"use client";

import { useState, useEffect } from "react";
import { useWallet, useConnection, useAnchorWallet } from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram, SYSVAR_SLOT_HASHES_PUBKEY } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/Toast";
import { useLotteryState } from "@/hooks/useLotteryState";
import { useDrawVotes } from "@/hooks/useDrawVotes";
import { useOnChainEvents } from "@/hooks/useOnChainEvents";
import { getLotteryProgram, PROGRAM_ID, getConfigPDA, getLotteryStatePDA, u64LE } from "@/lib/lottery-client";
import IDL from "@/lib/idl/pruv_lottery.json";

import { getConnection } from "@/lib/rpc";
const OPERATOR = "6kacXz5Yb5X2RcsSt8GasPwdj3EfLGHJHy9YH7JLYPTP";
const NODE_KEY  = "pruv-node-2024";

function fmtSol(lamports: bigint | number) {
  return (Number(lamports) / 1e9).toFixed(4) + " SOL";
}
function timeAgo(ms: number) {
  const s = Math.floor((Date.now() - ms) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

// Replicate on-chain winner index derivation (must match programs/pruv-lottery/src/lib.rs)
function deriveWinnerIndex(slotHash: Buffer, roundId: bigint, ticketCount: bigint): bigint {
  const rid = Buffer.alloc(8); new DataView(rid.buffer).setBigUint64(0, roundId, true);
  const tc  = Buffer.alloc(8); new DataView(tc.buffer).setBigUint64(0, ticketCount, true);
  const acc = Buffer.alloc(8);
  for (let i = 0; i < 8; i++)
    acc[i] = slotHash[i] ^ slotHash[i+8] ^ slotHash[i+16] ^ slotHash[i+24] ^ rid[i] ^ tc[i];
  return new DataView(acc.buffer).getBigUint64(0, true) % ticketCount;
}

function readSlotHash(data: Buffer, target: bigint): Buffer {
  const count = Number(new DataView(data.buffer).getBigUint64(0, true));
  let fallback: Buffer | null = null;
  for (let i = 0; i < count; i++) {
    const off  = 8 + i * 40;
    const slot = new DataView(data.buffer, data.byteOffset + off).getBigUint64(0, true);
    const hash = Buffer.from(data.subarray(off + 8, off + 40));
    if (slot === target) return hash;
    if (!fallback) fallback = hash;
  }
  if (!fallback) throw new Error("SlotHashes empty");
  return fallback;
}

function getDrawVotePDA(roundId: bigint, node: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("draw_vote"), u64LE(roundId), node.toBuffer()],
    PROGRAM_ID
  );
}
function getNodePrizePDA(roundId: bigint): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("node_prizes"), u64LE(roundId)],
    PROGRAM_ID
  );
}

// ── Auth Gate ─────────────────────────────────────────────────────────────────
function AuthGate({ onAuth }: { onAuth: () => void }) {
  const [key, setKey] = useState("");
  const [err, setErr] = useState(false);
  const { publicKey } = useWallet();

  useEffect(() => {
    if (publicKey?.toBase58() === OPERATOR) onAuth();
  }, [publicKey, onAuth]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (key === NODE_KEY) onAuth();
    else { setErr(true); setTimeout(() => setErr(false), 1500); }
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="w-12 h-12 bg-sky-700 rounded-xl mx-auto flex items-center justify-center text-2xl mb-4">⬡</div>
          <h1 className="text-xl font-bold text-white">Node Operator Portal</h1>
          <p className="text-zinc-500 text-sm mt-1">PRUV Network — devnet</p>
        </div>

        {/* Single real node */}
        <div className="flex items-center gap-3 p-3 rounded-xl border border-sky-600 bg-sky-950/30">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-mono text-sky-300 truncate">{OPERATOR.slice(0,8)}…{OPERATOR.slice(-4)}</p>
            <p className="text-xs text-zinc-600 mt-0.5">devnet operator node</p>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <input
            type="password"
            value={key}
            onChange={e => setKey(e.target.value)}
            placeholder="Operator key"
            className={cn(
              "w-full bg-zinc-900 border rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 outline-none transition-colors",
              err ? "border-red-600" : "border-zinc-700 focus:border-sky-600"
            )}
          />
          <button type="submit" className="w-full bg-sky-700 hover:bg-sky-600 text-white py-3 rounded-xl font-semibold transition-all">
            Enter Portal
          </button>
        </form>

        <p className="text-center text-xs text-zinc-700">
          Or connect the operator wallet to auto-enter
        </p>
      </div>
    </div>
  );
}

// ── Main Portal ───────────────────────────────────────────────────────────────
export default function OperatorPage() {
  const [authed, setAuthed] = useState(false);
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const anchorWallet = useAnchorWallet();
  const { toast } = useToast();

  const { round, loading: roundLoading } = useLotteryState();
  const votes = useDrawVotes(round?.roundId ?? null);
  const events = useOnChainEvents(40);

  const [myVotedRound, setMyVotedRound] = useState<bigint | null>(null);
  const [claimedRound, setClaimedRound] = useState<bigint | null>(null);
  const [nodeBalance, setNodeBalance] = useState<bigint>(0n);

  const isOperator = publicKey?.toBase58() === OPERATOR;
  const canSign = isOperator && !!anchorWallet;

  // Check if already voted for current round
  useEffect(() => {
    if (!round?.roundId || !publicKey) return;
    const conn = getConnection();
    const [dvPDA] = getDrawVotePDA(round.roundId, publicKey);
    conn.getAccountInfo(dvPDA).then(info => {
      if (info) setMyVotedRound(round.roundId);
    }).catch(() => {});
  }, [round?.roundId, publicKey]);

  // Fetch operator wallet balance
  useEffect(() => {
    if (!publicKey) return;
    const conn = getConnection();
    conn.getBalance(publicKey).then(b => setNodeBalance(BigInt(b))).catch(() => {});
    const id = setInterval(() => {
      conn.getBalance(publicKey).then(b => setNodeBalance(BigInt(b))).catch(() => {});
    }, 15_000);
    return () => clearInterval(id);
  }, [publicKey]);

  // ── cast_draw_vote ──────────────────────────────────────────────────────────
  async function handleVote() {
    if (!canSign || !round) { toast("Connect operator wallet", "error"); return; }
    try {
      const conn = getConnection();
      const program = getLotteryProgram(anchorWallet, connection);
      const [configPDA] = getConfigPDA();
      const [statePDA] = getLotteryStatePDA(round.roundId);
      const [dvPDA] = getDrawVotePDA(round.roundId, publicKey!);

      // Fetch SlotHash sysvar
      const shInfo = await conn.getAccountInfo(SYSVAR_SLOT_HASHES_PUBKEY);
      if (!shInfo) throw new Error("SlotHashes unavailable");
      const slotHash = readSlotHash(Buffer.from(shInfo.data), round.endSlot);
      const winnerIndex = deriveWinnerIndex(slotHash, round.roundId, round.ticketCount);

      toast(`Derived winner index: ${winnerIndex}`, "success");

      const sig = await (program.methods as any)
        .castDrawVote(new anchor.BN(round.roundId.toString()), new anchor.BN(winnerIndex.toString()))
        .accounts({
          config: configPDA,
          lotteryState: statePDA,
          drawVote: dvPDA,
          slotHashes: SYSVAR_SLOT_HASHES_PUBKEY,
          nodeOperator: publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc({ commitment: "confirmed" });

      toast(`Vote cast · winner #${winnerIndex} · ${sig.slice(0, 8)}…`, "success");
      setMyVotedRound(round.roundId);
    } catch (e) {
      toast(e instanceof Error ? e.message.slice(0, 100) : "Vote failed", "error");
    }
  }

  // ── claim_node_prize ────────────────────────────────────────────────────────
  async function handleClaim() {
    if (!canSign || !round) { toast("Connect operator wallet", "error"); return; }
    try {
      const program = getLotteryProgram(anchorWallet, connection);
      const [dvPDA] = getDrawVotePDA(round.roundId, publicKey!);
      const [npPDA] = getNodePrizePDA(round.roundId);

      const sig = await (program.methods as any)
        .claimNodePrize(new anchor.BN(round.roundId.toString()))
        .accounts({
          drawVote: dvPDA,
          nodePrizePool: npPDA,
          nodeOperator: publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc({ commitment: "confirmed" });

      toast(`Prize claimed · ${sig.slice(0, 8)}…`, "success");
      setClaimedRound(round.roundId);
    } catch (e) {
      toast(e instanceof Error ? e.message.slice(0, 100) : "Claim failed", "error");
    }
  }

  if (!authed) return <AuthGate onAuth={() => setAuthed(true)} />;

  const hasVoted = myVotedRound === round?.roundId ||
    votes.some(v => v.nodePubkey === publicKey?.toBase58());
  const hasClaimed = claimedRound === round?.roundId;
  const threshold = Math.ceil(Math.max(1, round?.activeNodeCount ?? 1) * 2 / 3);
  const prizePool = round
    ? (round.prizePoolLamports > 0n ? round.prizePoolLamports : round.ticketCount * 10_000_000n)
    : 0n;

  // Activity log from real events (vote + claim events for this node)
  const activityLog = [...events]
    .filter(e => (e.type === "DrawVoteCast" && e.node === publicKey?.toBase58()) ||
                 e.type === "RoundFinalized" || e.type === "RoundOpened")
    .reverse()
    .slice(0, 20);

  // Earnings from finalized rounds where node voted
  const earnedEvents = events.filter(e => e.type === "RoundFinalized");

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <span className="text-sky-400">⬡</span> Node Operator Portal
          </h1>
          <p className="font-mono text-zinc-500 text-sm mt-0.5">
            {publicKey?.toBase58().slice(0, 8) ?? OPERATOR.slice(0, 8)}…
            {isOperator && <span className="ml-2 text-emerald-400">(operator wallet)</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border bg-emerald-950/40 border-emerald-800 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Online
          </span>
          <button onClick={() => setAuthed(false)} className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
            Logout
          </button>
        </div>
      </div>

      {!canSign && (
        <div className="border border-yellow-800 bg-yellow-950/20 rounded-xl px-4 py-3 text-xs text-yellow-400">
          ⚠️ Connect the operator wallet to send transactions ({OPERATOR.slice(0, 8)}…{OPERATOR.slice(-4)})
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left */}
        <div className="lg:col-span-2 space-y-5">

          {/* Current Round */}
          <div className="border border-zinc-800 bg-zinc-900/50 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">🗳️ Current Round</h2>
              <span className={cn("text-xs px-2.5 py-1 rounded-full border",
                roundLoading ? "border-zinc-700 text-zinc-500" :
                round?.status === 0 ? "bg-emerald-950/40 border-emerald-800 text-emerald-400" :
                round?.status === 1 ? "bg-yellow-950/40 border-yellow-800 text-yellow-400" :
                "bg-zinc-800 border-zinc-700 text-zinc-500"
              )}>
                {roundLoading ? "Loading…" : round?.status === 0 ? "Open" : round?.status === 1 ? "Committing" : "Closed"}
              </span>
            </div>

            {round && (
              <div className="grid grid-cols-3 gap-3">
                <Stat label="Round"    value={`#${round.roundId}`} mono />
                <Stat label="Tickets"  value={round.ticketCount.toString()} />
                <Stat label="Prize Pool" value={fmtSol(prizePool)} accent />
              </div>
            )}

            {/* Consensus progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-500">Consensus progress</span>
                <span className="text-zinc-400">{votes.length}/{round?.activeNodeCount ?? 1} voted · threshold {threshold}</span>
              </div>
              <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all duration-500",
                    votes.length >= threshold ? "bg-emerald-500" : "bg-violet-600")}
                  style={{ width: `${Math.min((votes.length / Math.max(1, round?.activeNodeCount ?? 1)) * 100, 100)}%` }}
                />
              </div>
              {votes.map(v => (
                <div key={v.nodePubkey} className="flex items-center gap-2 text-xs text-zinc-500">
                  <span className="text-emerald-400">✓</span>
                  <span className="font-mono">{v.nodePubkey.slice(0, 8)}…</span>
                  <span className="text-zinc-600">winner index #{v.winnerIndex?.toString()}</span>
                </div>
              ))}
            </div>

            {/* cast_draw_vote */}
            <div className={cn("rounded-xl border p-4 space-y-3 transition-colors",
              round?.status === 1 && !hasVoted ? "border-yellow-800 bg-yellow-950/10" : "border-zinc-800 bg-zinc-800/20"
            )}>
              <div>
                <p className="text-sm font-semibold text-zinc-200">cast_draw_vote</p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Reads SlotHash sysvar → XOR-fold → derives winner index → submits on-chain
                </p>
              </div>
              {round?.status === 0 && <p className="text-xs text-zinc-600">Waiting for round to close…</p>}
              {round?.status === 1 && (hasVoted ? (
                <div className="flex items-center gap-2 text-xs text-emerald-400">
                  <span>✓</span><span>Vote submitted for round #{round.roundId.toString()}</span>
                </div>
              ) : (
                <button
                  onClick={handleVote}
                  disabled={!canSign}
                  className="w-full py-2.5 rounded-lg bg-yellow-700 hover:bg-yellow-600 disabled:bg-zinc-700 disabled:text-zinc-500 text-white text-sm font-semibold transition-all"
                >
                  Derive & Cast Vote
                </button>
              ))}
              {round?.status === 2 && <p className="text-xs text-zinc-600">Round finalized · {round.winner ? `winner: ${round.winner.slice(0,8)}…` : "no winner"}</p>}
            </div>

            {/* claim_node_prize */}
            <div className={cn("rounded-xl border p-4 space-y-3 transition-colors",
              round?.status === 2 && !hasClaimed ? "border-sky-800 bg-sky-950/10" : "border-zinc-800 bg-zinc-800/20"
            )}>
              <div>
                <p className="text-sm font-semibold text-zinc-200">claim_node_prize</p>
                <p className="text-xs text-zinc-500 mt-0.5">Claim your share of the 15% node pool from node_prize_pool PDA</p>
              </div>
              {round?.status !== 2 && <p className="text-xs text-zinc-600">Available after draw is finalized</p>}
              {round?.status === 2 && (hasClaimed ? (
                <div className="flex items-center gap-2 text-xs text-emerald-400"><span>✓</span><span>Prize claimed</span></div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-500">Your share (100% — sole operator)</span>
                    <span className="text-emerald-400 font-semibold">+{fmtSol((prizePool * 15n) / 100n)}</span>
                  </div>
                  <button
                    onClick={handleClaim}
                    disabled={!canSign}
                    className="w-full py-2.5 rounded-lg bg-sky-700 hover:bg-sky-600 disabled:bg-zinc-700 disabled:text-zinc-500 text-white text-sm font-semibold transition-all"
                  >
                    Claim Node Prize
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Activity Log */}
          <div className="border border-zinc-800 bg-zinc-900/50 rounded-xl p-5 space-y-3">
            <h2 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">📋 Activity Log (on-chain)</h2>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {activityLog.length === 0 && <p className="text-xs text-zinc-600">No on-chain events yet…</p>}
              {activityLog.map((ev, i) => {
                let text = "";
                let color = "violet";
                if (ev.type === "DrawVoteCast") { text = `cast_draw_vote · Round #${ev.roundId} winner index #${ev.voteCount}`; color = "yellow"; }
                if (ev.type === "RoundFinalized") { text = `finalize_draw · Round #${ev.roundId} winner ${ev.winner.slice(0,8)}…`; color = "emerald"; }
                if (ev.type === "RoundOpened")   { text = `initialize_round · Round #${ev.roundId} opened`; color = "sky"; }
                return (
                  <div key={i} className="flex items-start gap-3 text-xs">
                    <span className={cn("mt-1 w-1.5 h-1.5 rounded-full shrink-0",
                      color === "emerald" ? "bg-emerald-400" : color === "yellow" ? "bg-yellow-400" : color === "sky" ? "bg-sky-400" : "bg-violet-400"
                    )} />
                    <span className="flex-1 text-zinc-400">{text}</span>
                    <span className="text-zinc-700 shrink-0">{timeAgo(ev.ts)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Earnings from finalized rounds */}
          <div className="border border-zinc-800 bg-zinc-900/50 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
              <h2 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">💰 Earnings History (on-chain)</h2>
              <span className="text-xs text-emerald-400 font-semibold">
                +{fmtSol(earnedEvents.reduce((s, e) => s + ((e as any).winnerShare ? (BigInt((e as any).winnerShare) * 15n / 80n) : 0n), 0n))} est.
              </span>
            </div>
            <div className="divide-y divide-zinc-800/50">
              {earnedEvents.length === 0 && (
                <p className="px-5 py-4 text-xs text-zinc-600">No finalized rounds found in recent events</p>
              )}
              {earnedEvents.map((ev: any, i) => {
                const nodeShare = ev.winnerShare ? (BigInt(ev.winnerShare) * 15n / 80n) : 0n;
                return (
                  <div key={i} className="flex items-center gap-4 px-5 py-3 text-sm hover:bg-zinc-800/20 transition-colors">
                    <span className="font-mono text-zinc-500 w-12">#{ev.roundId.toString()}</span>
                    <span className="text-zinc-500 text-xs flex-1">Winner: {ev.winner.slice(0,8)}…</span>
                    <span className="text-emerald-400 font-semibold">+{fmtSol(nodeShare)}</span>
                    <span className="text-zinc-700 text-xs hidden sm:block">{timeAgo(ev.ts)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="space-y-4">
          {/* Node identity */}
          <div className="border border-sky-900/50 bg-sky-950/10 rounded-xl p-4 space-y-3">
            <p className="text-xs text-zinc-500 uppercase tracking-widest">Your Node</p>
            <div className="space-y-2 text-sm">
              <Row label="Pubkey"  value={`${OPERATOR.slice(0,8)}…${OPERATOR.slice(-4)}`} mono />
              <Row label="Balance" value={fmtSol(nodeBalance)} accent />
              <Row label="Type"    value="Devnet operator" />
              <Row label="Roles"   value="authority · treasury · node" />
            </div>
          </div>

          {/* Config summary */}
          <div className="border border-zinc-800 bg-zinc-900/50 rounded-xl p-4 space-y-2 text-sm">
            <p className="text-xs text-zinc-500 uppercase tracking-widest mb-2">Network</p>
            <Row label="Active Nodes"  value={`${round?.activeNodeCount ?? 1}`} />
            <Row label="Threshold"     value={`${threshold}/node(s)`} />
            <Row label="Node Share"    value="15% per round" />
            <Row label="Sole Operator" value="100% of 15%" accent />
          </div>

          {/* Vote status */}
          <div className="border border-zinc-800 bg-zinc-900/50 rounded-xl p-4 space-y-2">
            <p className="text-xs text-zinc-500 uppercase tracking-widest mb-2">Round #{round?.roundId.toString() ?? "?"}</p>
            <div className="flex items-center gap-2 text-xs">
              <span className={cn("w-2 h-2 rounded-full", hasVoted ? "bg-emerald-400" : "bg-zinc-600")} />
              <span className="text-zinc-400">{hasVoted ? "Voted this round" : "Not yet voted"}</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className={cn("w-2 h-2 rounded-full", hasClaimed ? "bg-emerald-400" : "bg-zinc-600")} />
              <span className="text-zinc-400">{hasClaimed ? "Prize claimed" : "Prize not yet claimed"}</span>
            </div>
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
