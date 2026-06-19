"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { useRoundDetail } from "@/hooks/useRoundDetail";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/Skeleton";
import ShareButton from "@/components/ShareButton";

function fmtSol(lamports: bigint) {
  return (Number(lamports) / 1e9).toFixed(4) + " SOL";
}

export default function RoundPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { publicKey } = useWallet();
  const [showAll, setShowAll] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const { detail: round, loading, notFound } = useRoundDetail(Number(id));

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  if (notFound && !loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <p className="text-zinc-500 text-lg">Round #{id} not found.</p>
        <Link href="/stats" className="text-violet-400 text-sm mt-3 inline-block hover:underline">
          ← Back to Stats
        </Link>
      </div>
    );
  }

  const winnerPrizeLamports = round ? (round.prizePoolLamports * 80n) / 100n : 0n;
  const visibleTickets = round ? (showAll ? round.tickets : round.tickets.slice(0, 12)) : [];
  const statusLabel = round
    ? round.status === 0 ? "Open" : round.status === 1 ? "Committing" : "Closed"
    : "Loading…";

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-zinc-500">
        <Link href="/stats" className="hover:text-zinc-300 transition-colors">Stats</Link>
        <span>›</span>
        <span className="text-zinc-300">Round #{id}</span>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-20" />)}
          </div>
          <Skeleton className="h-40" />
          <Skeleton className="h-64" />
        </div>
      ) : round && (<>

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Round #{round.roundId.toString()}</h1>
          <p className="text-zinc-500 text-sm mt-1">End slot #{round.endSlot.toLocaleString()}</p>
        </div>
        <div className="flex items-center gap-2">
          {round.winner && (
            <ShareButton
              text={`🏆 PRUVPOT Round #${round.roundId} — ${(Number(winnerPrizeLamports) / 1e9).toFixed(3)} SOL won by ${round.winner.slice(0,8)}…. Provably fair on-chain lottery. Verify yourself 👇`}
              url={`https://pruvpot.vercel.app/rounds/${round.roundId}`}
              label="Share round"
            />
          )}
          <span className={cn(
            "inline-flex items-center gap-1.5 text-xs border px-3 py-1.5 rounded-full",
            round.status === 0 ? "bg-emerald-950/40 border-emerald-800 text-emerald-400" :
            round.status === 1 ? "bg-yellow-950/40 border-yellow-800 text-yellow-400" :
            "bg-zinc-800 border-zinc-700 text-zinc-400"
          )}>
            <span className={cn("w-1.5 h-1.5 rounded-full",
              round.status === 0 ? "bg-emerald-400 animate-pulse" :
              round.status === 1 ? "bg-yellow-400 animate-pulse" : "bg-zinc-500"
            )} />
            {statusLabel}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Prize Pool"   value={fmtSol(round.prizePoolLamports)} />
        <StatCard label="Winner Prize" value={fmtSol(winnerPrizeLamports)} accent />
        <StatCard label="Tickets Sold" value={round.ticketCount.toString()} />
        <StatCard label="End Slot"     value={`#${round.endSlot.toLocaleString()}`} mono />
      </div>

      {/* Winner */}
      {round.winner ? (
        <div className="border border-emerald-800 bg-emerald-950/20 rounded-xl p-5">
          <p className="text-xs text-emerald-500 uppercase tracking-widest mb-3">Winner</p>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🏆</span>
              <div>
                <Link
                  href={`/u/${encodeURIComponent(round.winner)}`}
                  className="font-mono text-emerald-300 font-semibold hover:text-emerald-200 hover:underline break-all"
                >
                  {round.winner}
                  {publicKey?.toBase58() === round.winner && (
                    <span className="ml-2 text-[10px] bg-violet-800 text-violet-300 px-1.5 py-0.5 rounded-full align-middle">you</span>
                  )}
                </Link>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Ticket #{round.winnerIndex?.toString()} · Won {fmtSol(winnerPrizeLamports)}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : round.status < 2 ? (
        <div className="border border-zinc-800 bg-zinc-900/50 rounded-xl p-5">
          <p className="text-xs text-zinc-500 uppercase tracking-widest mb-2">Winner</p>
          <p className="text-sm text-zinc-500 italic">
            {round.status === 0
              ? "Round still open — winner derived after round closes"
              : "Nodes voting on winner index…"}
          </p>
        </div>
      ) : null}

      {/* SlotHash Proof */}
      {round.votes.length > 0 && (
        <div className="border border-zinc-800 bg-zinc-900/50 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-base">🔐</span>
            <h2 className="text-sm font-semibold text-zinc-200">SlotHash Proof</h2>
            <span className="text-xs bg-violet-900/50 text-violet-400 border border-violet-800 px-2 py-0.5 rounded-full ml-auto">
              PRUV Verified
            </span>
          </div>
          <div className="space-y-3">
            <ProofRow
              label="SlotHash (raw)"
              value={round.votes[0].slotHash}
              onCopy={() => copy(round.votes[0].slotHash, "hash")}
              copied={copied === "hash"}
            />
            {round.winnerIndex !== null && (
              <ProofRow
                label="XOR → Winner Index"
                value={`${round.winnerIndex.toString()} of ${round.ticketCount.toString()}`}
              />
            )}
            <div className="text-xs text-zinc-600 bg-zinc-800/50 rounded-lg p-3 font-mono leading-relaxed">
              <span className="text-zinc-500">formula: </span>
              <span className="text-violet-400">xorFold(slotHash[32→8])</span>
              <span className="text-zinc-500"> XOR </span>
              <span className="text-sky-400">roundId_LE</span>
              <span className="text-zinc-500"> XOR </span>
              <span className="text-emerald-400">ticketCount_LE</span>
              <span className="text-zinc-500"> % ticketCount</span>
            </div>
          </div>
        </div>
      )}

      {/* Node Votes */}
      {round.votes.length > 0 && (
        <div className="border border-zinc-800 bg-zinc-900/50 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-base">🗳️</span>
            <h2 className="text-sm font-semibold text-zinc-200">Node Consensus</h2>
            <span className="text-xs text-emerald-500 ml-auto">
              {round.votes.length} vote{round.votes.length !== 1 ? "s" : ""} on-chain
            </span>
          </div>
          {round.votes.map((v, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-zinc-800/40 rounded-lg">
              <span className="w-5 h-5 rounded-full bg-emerald-700 flex items-center justify-center text-xs font-bold text-white shrink-0">✓</span>
              <div className="flex-1 min-w-0">
                <Link
                  href={`/u/${encodeURIComponent(v.node)}`}
                  className="font-mono text-xs text-zinc-300 hover:text-violet-400 transition-colors truncate block"
                >
                  {v.node}
                </Link>
                <p className="text-xs text-zinc-600 mt-0.5">
                  winner index #{v.winnerIndex.toString()}
                  {v.claimed && <span className="ml-2 text-emerald-600">· prize claimed</span>}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Ticket List */}
      <div className="border border-zinc-800 bg-zinc-900/50 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <h2 className="text-sm font-semibold text-zinc-200">
            All Tickets ({round.ticketCount.toString()})
          </h2>
          <span className="text-xs text-zinc-600">Showing {visibleTickets.length}</span>
        </div>
        <div className="divide-y divide-zinc-800/50">
          {visibleTickets.length === 0 && (
            <p className="px-5 py-4 text-xs text-zinc-600">No tickets yet — be the first!</p>
          )}
          {visibleTickets.map((t) => (
            <div
              key={t.index.toString()}
              className={cn(
                "flex items-center gap-3 px-5 py-3 text-sm transition-colors",
                t.isWinner ? "bg-emerald-950/30 border-l-2 border-emerald-600" : "hover:bg-zinc-800/20"
              )}
            >
              <span className={cn(
                "font-mono text-xs w-8 shrink-0",
                t.isWinner ? "text-emerald-400 font-bold" : "text-zinc-600"
              )}>
                #{t.index.toString()}
              </span>
              <Link
                href={`/u/${encodeURIComponent(t.buyer)}`}
                className="font-mono text-zinc-300 flex-1 truncate hover:text-violet-400 transition-colors"
              >
                {t.buyer}
                {publicKey?.toBase58() === t.buyer && (
                  <span className="ml-2 text-[10px] bg-violet-800 text-violet-300 px-1.5 py-0.5 rounded-full align-middle">you</span>
                )}
              </Link>
              {t.isWinner && (
                <span className="text-xs bg-emerald-900 text-emerald-400 px-2 py-0.5 rounded-full font-semibold shrink-0">WINNER</span>
              )}
            </div>
          ))}
        </div>
        {!showAll && round.tickets.length > 12 && (
          <button
            onClick={() => setShowAll(true)}
            className="w-full py-3 text-xs text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/30 transition-colors border-t border-zinc-800"
          >
            Show all {round.tickets.length} tickets ↓
          </button>
        )}
      </div>

      </>)}
    </div>
  );
}

function StatCard({ label, value, accent, mono }: { label: string; value: string; accent?: boolean; mono?: boolean }) {
  return (
    <div className="border border-zinc-800 bg-zinc-900/50 rounded-xl p-4">
      <p className="text-xs text-zinc-500 mb-1">{label}</p>
      <p className={cn("text-lg font-bold", accent ? "text-emerald-400" : "text-white", mono && "font-mono text-base")}>
        {value}
      </p>
    </div>
  );
}

function ProofRow({ label, value, onCopy, copied }: {
  label: string; value: string; onCopy?: () => void; copied?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-xs text-zinc-600 w-28 shrink-0 pt-0.5">{label}</span>
      <div className="flex-1 min-w-0 flex items-center gap-2">
        <span className="font-mono text-xs text-zinc-400 break-all">{value}</span>
        {onCopy && (
          <button onClick={onCopy} className="shrink-0 text-xs text-zinc-600 hover:text-zinc-300 transition-colors">
            {copied ? "✓" : "⎘"}
          </button>
        )}
      </div>
    </div>
  );
}
