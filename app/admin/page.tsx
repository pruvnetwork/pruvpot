"use client";

import { useState, useEffect, useCallback } from "react";
import { useWallet, useConnection, useAnchorWallet } from "@solana/wallet-adapter-react";
import { Connection, PublicKey, SystemProgram, SYSVAR_SLOT_HASHES_PUBKEY } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/Toast";
import { useLotteryState } from "@/hooks/useLotteryState";
import { useDrawVotes } from "@/hooks/useDrawVotes";
import { useOnChainEvents } from "@/hooks/useOnChainEvents";
import { getLotteryProgram, PROGRAM_ID, getConfigPDA, getLotteryStatePDA, getTicketPDA, u64LE } from "@/lib/lottery-client";
import IDL from "@/lib/idl/pruv_lottery.json";

const RPC = process.env.NEXT_PUBLIC_RPC_URL ?? "https://api.devnet.solana.com";
const AUTHORITY = "Ddk15nuwaK3HZ8evHSwN93n1n3Xk4Gr8mt4fYN5TE1s1";
const OPERATOR_KEY = "pruv-admin-2024";

function fmtLamports(l: bigint | number) {
  return (Number(l) / 1e9).toFixed(4) + " SOL";
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
  const { publicKey } = useWallet();

  // Auto-auth if authority wallet connected
  useEffect(() => {
    if (publicKey?.toBase58() === AUTHORITY) onAuth();
  }, [publicKey, onAuth]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (val === OPERATOR_KEY) onAuth();
    else { setErr(true); setTimeout(() => setErr(false), 1500); }
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="w-12 h-12 bg-violet-600 rounded-xl mx-auto flex items-center justify-center text-xl font-bold mb-4">🔑</div>
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
              err ? "border-red-600" : "border-zinc-700 focus:border-violet-600"
            )}
          />
          <button type="submit" className="w-full bg-violet-600 hover:bg-violet-500 text-white py-3 rounded-xl font-semibold transition-all">
            Enter Panel
          </button>
        </form>
        <p className="text-center text-xs text-zinc-700">
          Or connect the authority wallet · <span className="font-mono text-zinc-600">{AUTHORITY.slice(0,8)}…</span>
        </p>
      </div>
    </div>
  );
}

// ── On-chain config ────────────────────────────────────────────────────────────
interface ChainConfig {
  authority: string;
  treasury: string;
  ticketPriceLamports: bigint;
  roundDurationSlots: bigint;
  nodeShareBps: number;
  treasuryShareBps: number;
  thresholdBps: number;
  activeNodeCount: number;
  currentRoundId: bigint;
}

function useAdminConfig() {
  const [cfg, setCfg] = useState<ChainConfig | null>(null);
  const [treasuryBalance, setTreasuryBalance] = useState<bigint>(0n);

  useEffect(() => {
    const conn = new Connection(RPC, "confirmed");
    const dummyWallet = {
      publicKey: PublicKey.default,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      signTransaction: async (tx: any) => tx,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      signAllTransactions: async (txs: any[]) => txs,
    };
    const provider = new anchor.AnchorProvider(conn, dummyWallet as never, { commitment: "confirmed" });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const program = new anchor.Program(IDL as any, provider);
    const [configPDA] = getConfigPDA();

    async function load() {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const c: any = await (program.account as any).lotteryConfig.fetch(configPDA);
        const treasury = (c.treasury as PublicKey).toBase58();
        const config: ChainConfig = {
          authority: (c.authority as PublicKey).toBase58(),
          treasury,
          ticketPriceLamports: BigInt(c.ticketPriceLamports.toString()),
          roundDurationSlots: BigInt(c.roundDurationSlots.toString()),
          nodeShareBps: Number(c.nodeShareBps),
          treasuryShareBps: Number(c.treasuryShareBps),
          thresholdBps: Number(c.thresholdBps),
          activeNodeCount: Number(c.activeNodeCount),
          currentRoundId: BigInt(c.currentRoundId.toString()),
        };
        setCfg(config);
        const bal = await conn.getBalance(new PublicKey(treasury));
        setTreasuryBalance(BigInt(bal));
      } catch (e) {
        console.error("Config fetch error", e);
      }
    }

    load();
    const id = setInterval(load, 10_000);
    return () => clearInterval(id);
  }, []);

  return { cfg, treasuryBalance };
}

// ── IxButton ───────────────────────────────────────────────────────────────────
function IxButton({
  label, description, variant = "default", disabled, onClick,
}: {
  label: string; description: string;
  variant?: "default" | "warning" | "danger" | "success";
  disabled?: boolean;
  onClick: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const colors = {
    default: "bg-violet-600 hover:bg-violet-500 text-white",
    warning: "bg-yellow-700 hover:bg-yellow-600 text-white",
    danger:  "bg-red-700 hover:bg-red-600 text-white",
    success: "bg-emerald-700 hover:bg-emerald-600 text-white",
  };
  async function handle() {
    if (busy || disabled) return;
    setBusy(true);
    try { await onClick(); } finally { setBusy(false); }
  }
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
        {busy
          ? <span className="flex items-center gap-1.5"><span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full inline-block animate-spin" />Sending…</span>
          : label.split("·")[0].trim()
        }
      </button>
    </div>
  );
}

// ── Main Panel ─────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const { toast } = useToast();
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const anchorWallet = useAnchorWallet();

  const [newTreasury, setNewTreasury] = useState("");
  const [newAuthority, setNewAuthority] = useState("");

  const { round, loading: roundLoading } = useLotteryState();
  const votes = useDrawVotes(round?.roundId ?? null);
  const events = useOnChainEvents(30);
  const { cfg, treasuryBalance } = useAdminConfig();

  const onAuth = useCallback(() => setAuthed(true), []);
  if (!authed) return <AuthGate onAuth={onAuth} />;

  const isAuthority = publicKey?.toBase58() === AUTHORITY;
  const canSign = isAuthority && !!anchorWallet;

  // ── Handlers ──────────────────────────────────────────────────────────────
  async function handleInitRound() {
    if (!canSign || !cfg) { toast("Connect authority wallet", "error"); return; }
    try {
      const program = getLotteryProgram(anchorWallet, connection);
      const nextId = cfg.currentRoundId + 1n;
      const [statePDA] = getLotteryStatePDA(nextId);
      const [configPDA] = getConfigPDA();
      const sig = await (program.methods as any)
        .initializeRound(new anchor.BN(nextId.toString()))
        .accounts({ config: configPDA, lotteryState: statePDA, payer: publicKey, systemProgram: SystemProgram.programId })
        .rpc({ commitment: "confirmed" });
      toast(`Round #${nextId} opened · ${sig.slice(0, 8)}…`, "success");
    } catch (e) {
      toast(e instanceof Error ? e.message.slice(0, 80) : "TX failed", "error");
    }
  }

  async function handleUpdateNodeCount() {
    if (!canSign || !cfg) { toast("Connect authority wallet", "error"); return; }
    try {
      const program = getLotteryProgram(anchorWallet, connection);
      const [configPDA] = getConfigPDA();
      const sig = await (program.methods as any)
        .updateNodeCount(cfg.activeNodeCount)
        .accounts({ config: configPDA, authority: publicKey })
        .rpc({ commitment: "confirmed" });
      toast(`Node count synced · ${sig.slice(0, 8)}…`, "success");
    } catch (e) {
      toast(e instanceof Error ? e.message.slice(0, 80) : "TX failed", "error");
    }
  }

  async function handleUpdateConfig() {
    if (!canSign) { toast("Connect authority wallet", "error"); return; }
    let tPubkey: PublicKey | null = null;
    let aPubkey: PublicKey | null = null;
    try {
      if (newTreasury.trim()) tPubkey = new PublicKey(newTreasury.trim());
      if (newAuthority.trim()) aPubkey = new PublicKey(newAuthority.trim());
    } catch { toast("Invalid pubkey", "error"); return; }
    if (!tPubkey && !aPubkey) { toast("Enter at least one address to update", "error"); return; }
    try {
      const program = getLotteryProgram(anchorWallet, connection);
      const [configPDA] = getConfigPDA();
      const sig = await (program.methods as any)
        .updateConfig(tPubkey ?? null, aPubkey ?? null, null, null)
        .accounts({ config: configPDA, authority: publicKey })
        .rpc({ commitment: "confirmed" });
      toast(`Config updated · ${sig.slice(0, 8)}…`, "success");
      setNewTreasury("");
      setNewAuthority("");
    } catch (e) {
      toast(e instanceof Error ? e.message.slice(0, 80) : "TX failed", "error");
    }
  }

  async function handleFinalize() {
    if (!canSign || !round || !cfg) { toast("Connect authority wallet", "error"); return; }
    try {
      const program = getLotteryProgram(anchorWallet, connection);
      const [configPDA] = getConfigPDA();
      const [statePDA] = getLotteryStatePDA(round.roundId);

      // Derive winner ticket from draw votes
      const winnerIndex = votes[0]?.winnerIndex;
      if (winnerIndex === undefined) { toast("No draw votes yet", "error"); return; }
      const [winnerTicketPDA] = getTicketPDA(round.roundId, winnerIndex);

      // Fetch winner wallet from ticket account
      const conn2 = new Connection(RPC, "confirmed");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dummyWallet = { publicKey: PublicKey.default, signTransaction: async (tx: any) => tx, signAllTransactions: async (txs: any[]) => txs };
      const readProvider = new anchor.AnchorProvider(conn2, dummyWallet as never, { commitment: "confirmed" });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const readProgram = new anchor.Program(IDL as any, readProvider);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ticket: any = await (readProgram.account as any).ticket.fetch(winnerTicketPDA);
      const winnerWallet: PublicKey = ticket.buyer;

      // node_prize_pool PDA
      const [nodePrizePDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("node_prizes"), u64LE(round.roundId)],
        PROGRAM_ID
      );

      const sig = await (program.methods as any)
        .finalizeDraw(new anchor.BN(round.roundId.toString()))
        .accounts({
          config: configPDA,
          lotteryState: statePDA,
          winnerTicket: winnerTicketPDA,
          winnerWallet,
          nodePrizePool: nodePrizePDA,
          treasury: new PublicKey(cfg.treasury),
          caller: publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc({ commitment: "confirmed" });
      toast(`Draw finalized · ${sig.slice(0, 8)}…`, "success");
    } catch (e) {
      toast(e instanceof Error ? e.message.slice(0, 80) : "TX failed", "error");
    }
  }

  const winnerBps = cfg ? 10000 - cfg.nodeShareBps - cfg.treasuryShareBps : 8000;

  // Activity log: derive from on-chain events
  const activityLog = [...events].reverse().map(ev => {
    if (ev.type === "TicketPurchased") return { text: `buy_ticket · Round #${ev.roundId} ticket #${ev.index} by ${ev.buyer.slice(0,6)}…`, ts: ev.ts, color: "violet" };
    if (ev.type === "RoundOpened")    return { text: `initialize_round · Round #${ev.roundId} opened`, ts: ev.ts, color: "emerald" };
    if (ev.type === "RoundFinalized") return { text: `finalize_draw · Round #${ev.roundId} winner ${ev.winner.slice(0,6)}… · ${fmtLamports(ev.winnerShare)}`, ts: ev.ts, color: "yellow" };
    if (ev.type === "DrawVoteCast")   return { text: `cast_draw_vote · Round #${ev.roundId} node ${ev.node.slice(0,6)}… (${ev.voteCount} votes)`, ts: ev.ts, color: "sky" };
    return null;
  }).filter(Boolean) as { text: string; ts: number; color: string }[];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            Admin Panel
            <span className="text-xs bg-red-900/60 border border-red-800 text-red-400 px-2 py-0.5 rounded-full font-normal">Operator Only</span>
          </h1>
          <p className="text-zinc-500 text-sm mt-0.5 font-mono">
            {cfg?.authority.slice(0,8)}… · devnet
            {isAuthority && <span className="ml-2 text-emerald-400">(authority wallet)</span>}
          </p>
        </div>
        {round && (
          <div className="flex items-center gap-2 text-xs text-zinc-500 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2">
            <span className={cn("w-1.5 h-1.5 rounded-full",
              round.status === 0 ? "bg-emerald-400 animate-pulse" :
              round.status === 1 ? "bg-yellow-400 animate-pulse" : "bg-zinc-500"
            )} />
            Round #{round.roundId.toString()} · {round.status === 0 ? "Open" : round.status === 1 ? "Drawing" : "Closed"}
          </div>
        )}
      </div>

      {!canSign && (
        <div className="border border-yellow-800 bg-yellow-950/20 rounded-xl px-4 py-3 text-xs text-yellow-400">
          ⚠️ Connect the authority wallet to send transactions ({AUTHORITY.slice(0, 8)}…{AUTHORITY.slice(-4)})
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left */}
        <div className="lg:col-span-2 space-y-5">

          {/* Round Controls */}
          <Section title="Round Instructions" icon="▶">
            <IxButton
              label="initialize_round · Open new round"
              description={`Creates Round #${cfg ? (cfg.currentRoundId + 1n).toString() : "?"} PDA with ${cfg ? cfg.roundDurationSlots.toLocaleString() : "?"} slot window`}
              variant="success"
              disabled={!canSign || round?.status === 0}
              onClick={handleInitRound}
            />
            <IxButton
              label="finalize_draw · Settle winner"
              description={`Requires 2/3 node vote threshold · currently ${votes.length} vote(s) for round #${round?.roundId.toString() ?? "?"}`}
              variant="warning"
              disabled={!canSign || round?.status !== 1 || votes.length === 0}
              onClick={handleFinalize}
            />
            <div className="flex items-center gap-3 p-4 bg-zinc-800/20 rounded-xl border border-zinc-800/50">
              <span className="text-zinc-600 text-xl">⬡</span>
              <div>
                <p className="text-sm text-zinc-500">cast_draw_vote & claim_node_prize</p>
                <p className="text-xs text-zinc-700 mt-0.5">
                  Node operator instructions — managed in the{" "}
                  <a href="/operator" className="text-sky-600 hover:text-sky-400 underline">Node Operator Portal</a>
                </p>
              </div>
            </div>
          </Section>

          {/* Config Controls */}
          <Section title="Config Instructions" icon="⚙">
            <IxButton
              label="update_node_count · Sync operators"
              description={`Current: ${cfg?.activeNodeCount ?? "?"} nodes — updates threshold for draw votes`}
              disabled={!canSign}
              onClick={handleUpdateNodeCount}
            />

            {/* update_config: rotate treasury / authority */}
            <div className="p-4 bg-zinc-800/40 rounded-xl space-y-3">
              <div>
                <p className="text-sm font-semibold text-zinc-200">update_config · Rotate wallets</p>
                <p className="text-xs text-zinc-500 mt-0.5">Set new treasury and/or authority address — leave blank to keep current</p>
              </div>
              <div className="space-y-2">
                <div>
                  <label className="text-xs text-zinc-500 block mb-1">New treasury</label>
                  <input
                    value={newTreasury}
                    onChange={e => setNewTreasury(e.target.value)}
                    placeholder={cfg?.treasury.slice(0,8) + "… (current)"}
                    className="w-full bg-zinc-900 border border-zinc-700 focus:border-violet-600 rounded-lg px-3 py-2 text-xs font-mono text-white placeholder:text-zinc-700 outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 block mb-1">New authority</label>
                  <input
                    value={newAuthority}
                    onChange={e => setNewAuthority(e.target.value)}
                    placeholder={cfg?.authority.slice(0,8) + "… (current)"}
                    className="w-full bg-zinc-900 border border-zinc-700 focus:border-yellow-600 rounded-lg px-3 py-2 text-xs font-mono text-white placeholder:text-zinc-700 outline-none transition-colors"
                  />
                  {newAuthority && (
                    <p className="text-xs text-yellow-600 mt-1">⚠️ Rotating authority locks you out of admin panel with current wallet</p>
                  )}
                </div>
              </div>
              <button
                onClick={handleUpdateConfig}
                disabled={!canSign || (!newTreasury.trim() && !newAuthority.trim())}
                className="w-full py-2 rounded-lg text-xs font-semibold transition-all bg-violet-700 hover:bg-violet-600 disabled:bg-zinc-700 disabled:text-zinc-500 text-white"
              >
                Send update_config TX
              </button>
            </div>

            {/* BPS display (read-only — no on-chain update_bps instruction) */}
            {cfg && (
              <div className="p-4 bg-zinc-800/40 rounded-xl space-y-3">
                <p className="text-sm font-semibold text-zinc-200">Prize Split (BPS) <span className="text-zinc-600 font-normal text-xs">— on-chain</span></p>
                <div className="flex gap-3">
                  <BpsPill label="Winner"   bps={winnerBps}            color="emerald" />
                  <BpsPill label="Nodes"    bps={cfg.nodeShareBps}     color="sky" />
                  <BpsPill label="Treasury" bps={cfg.treasuryShareBps} color="violet" />
                </div>
              </div>
            )}
          </Section>

          {/* Activity Log */}
          <Section title="Activity Log (on-chain)" icon="📋">
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {activityLog.length === 0 && (
                <p className="text-xs text-zinc-600 py-2">Loading on-chain events…</p>
              )}
              {activityLog.map((e, i) => (
                <div key={i} className="flex items-start gap-3 text-xs">
                  <span className={cn("mt-0.5 w-1.5 h-1.5 rounded-full shrink-0",
                    e.color === "emerald" ? "bg-emerald-400" :
                    e.color === "yellow"  ? "bg-yellow-400" :
                    e.color === "sky"     ? "bg-sky-400" : "bg-violet-400"
                  )} />
                  <span className="flex-1 text-zinc-400 leading-relaxed">{e.text}</span>
                  <span className="text-zinc-700 shrink-0">{timeAgo(e.ts)}</span>
                </div>
              ))}
            </div>
          </Section>
        </div>

        {/* Right */}
        <div className="space-y-4">
          {/* Treasury */}
          <div className="border border-zinc-800 bg-zinc-900/50 rounded-xl p-4 space-y-3">
            <p className="text-xs text-zinc-500 uppercase tracking-widest">Treasury</p>
            <p className="text-2xl font-bold text-white">{fmtLamports(treasuryBalance)}</p>
            <div className="text-xs text-zinc-600 space-y-1">
              <div className="flex justify-between">
                <span>Treasury rate</span>
                <span className="text-zinc-400">{cfg ? (cfg.treasuryShareBps / 100).toFixed(1) : "?"}% per round</span>
              </div>
            </div>
            <div className="text-xs border-t border-zinc-800 pt-2">
              <a
                href={`https://explorer.solana.com/address/${cfg?.treasury}?cluster=devnet`}
                target="_blank" rel="noopener noreferrer"
                className="font-mono text-zinc-500 hover:text-sky-400 transition-colors"
              >
                {cfg?.treasury.slice(0, 8)}…{cfg?.treasury.slice(-4)} ↗
              </a>
            </div>
          </div>

          {/* Current Round */}
          <div className="border border-zinc-800 bg-zinc-900/50 rounded-xl p-4 space-y-3">
            <p className="text-xs text-zinc-500 uppercase tracking-widest">Current Round</p>
            {roundLoading ? (
              <p className="text-xs text-zinc-600">Loading…</p>
            ) : round ? (
              <div className="space-y-2 text-sm">
                <Row label="Round ID"   value={`#${round.roundId}`} mono />
                <Row label="Tickets"    value={round.ticketCount.toString()} />
                <Row label="Prize Pool" value={fmtLamports(round.prizePoolLamports > 0n ? round.prizePoolLamports : round.ticketCount * (cfg?.ticketPriceLamports ?? 10_000_000n))} accent />
                <Row label="Draw Votes" value={`${votes.length}/${round.activeNodeCount}`} />
                <Row label="End Slot"   value={round.endSlot.toString()} mono />
              </div>
            ) : (
              <p className="text-xs text-zinc-600">No active round</p>
            )}
          </div>

          {/* Nodes */}
          <div className="border border-zinc-800 bg-zinc-900/50 rounded-xl p-4 space-y-3">
            <p className="text-xs text-zinc-500 uppercase tracking-widest">Active Nodes ({cfg?.activeNodeCount ?? 0})</p>
            <div className="flex items-center gap-2 text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
              <span className="font-mono text-zinc-400 flex-1 truncate">{AUTHORITY.slice(0,8)}…{AUTHORITY.slice(-4)}</span>
              <span className="text-zinc-600 shrink-0">operator</span>
            </div>
          </div>

          {/* Config summary */}
          {cfg && (
            <div className="border border-zinc-800 bg-zinc-900/50 rounded-xl p-4 space-y-2 text-xs">
              <p className="text-zinc-500 uppercase tracking-widest mb-2">On-chain Config</p>
              <Row label="Ticket Price"    value={fmtLamports(cfg.ticketPriceLamports)} />
              <Row label="Round Duration"  value={`${cfg.roundDurationSlots.toLocaleString()} slots`} />
              <Row label="Current Round"   value={`#${cfg.currentRoundId}`} mono />
              <Row label="Threshold"       value={`${cfg.thresholdBps} bps`} mono />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="border border-zinc-800 bg-zinc-900/50 rounded-xl p-5 space-y-3">
      <h2 className="text-sm font-semibold text-zinc-200 flex items-center gap-2"><span>{icon}</span> {title}</h2>
      {children}
    </div>
  );
}

function BpsPill({ label, bps, color }: { label: string; bps: number; color: "emerald" | "sky" | "violet" }) {
  const c = { emerald: "bg-emerald-950 border-emerald-800 text-emerald-300", sky: "bg-sky-950 border-sky-800 text-sky-300", violet: "bg-violet-950 border-violet-800 text-violet-300" }[color];
  return (
    <div className={cn("flex-1 border rounded-lg px-2 py-1.5 text-center text-xs", c)}>
      <p className="text-zinc-500 text-[10px]">{label}</p>
      <p className="font-semibold">{(bps / 100).toFixed(1)}%</p>
    </div>
  );
}

function Row({ label, value, mono, accent }: { label: string; value: string; mono?: boolean; accent?: boolean }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-zinc-600">{label}</span>
      <span className={cn("font-medium", accent ? "text-emerald-400" : "text-zinc-300", mono && "font-mono")}>{value}</span>
    </div>
  );
}
