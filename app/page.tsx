"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import { useWallet, useConnection, useAnchorWallet } from "@solana/wallet-adapter-react";
import AttestationBadge from "@/components/AttestationBadge";
import NodeConsensus from "@/components/NodeConsensus";
import PrizePool from "@/components/PrizePool";
import RoundHistory from "@/components/RoundHistory";
import VerifyPanel from "@/components/VerifyPanel";
import BuyTicketButton from "@/components/BuyTicketButton";
import StatsBar from "@/components/StatsBar";
import LiveFeed from "@/components/LiveFeed";
import WinnerReveal from "@/components/WinnerReveal";
import ReferralCard from "@/components/ReferralCard";
import ShareButton from "@/components/ShareButton";
import WinnerBanner from "@/components/WinnerBanner";
import LiveChat from "@/components/LiveChat";
import { RoundCardSkeleton, NodeSkeleton, Skeleton } from "@/components/Skeleton";
import { formatCountdown } from "@/lib/utils";
import type { NodeInfo, AttestationStatus } from "@/lib/types";
import { buyTicket, PROGRAM_ID } from "@/lib/lottery-client";
import { useLotteryState } from "@/hooks/useLotteryState";
import { useRoundHistory } from "@/hooks/useRoundHistory";
import { useDrawVotes } from "@/hooks/useDrawVotes";

// Single known node operator on devnet
const DEVNET_NODES: NodeInfo[] = [
  {
    operatorPubkey: "6kacXz5Yb5X2RcsSt8GasPwdj3EfLGHJHy9YH7JLYPTP",
    stakeAmount: 0n,
    reputation: 100,
    totalAttestations: 0,
    isActive: true,
  },
];

const ATTESTATION: AttestationStatus = {
  programId: PROGRAM_ID.toBase58(),
  isAttested: true,
  programHash: "be9f5313791e9e43cab3796a438839da25363b74587277cdb3564b9605f07770",
  attestedAt: 1750271600,
  expiresAt: 1750271600 + 365 * 24 * 3600,
  nodeCount: 1,
  trustScore: 97,
};

export default function Home() {
  const { round, countdown, ticketPriceLamports, loading, error } = useLotteryState();
  const { history, totalPaidLamports } = useRoundHistory();
  const votes = useDrawVotes(round?.roundId ?? null);
  const [winner, setWinner] = useState<string | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const prevWinnerRef = useRef<string | null>(null);

  // Show banner when chain returns a winner
  useEffect(() => {
    const w = round?.winner ?? null;
    if (w && w !== prevWinnerRef.current) {
      prevWinnerRef.current = w;
      setWinner(w);
      setShowBanner(true);
    }
  }, [round?.winner]);

  const { connected } = useWallet();
  const { connection } = useConnection();
  const anchorWallet = useAnchorWallet();

  const handleBuy = useCallback(async () => {
    if (!anchorWallet || !connected || !round) throw new Error("Wallet not connected");
    const ticketIndex = round.ticketCount; // on-chain count = next ticket index
    await buyTicket(anchorWallet, connection, round.roundId, ticketIndex);
  }, [anchorWallet, connected, connection, round]);

  if (loading || !round) return (
    <div className="max-w-5xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-5 lg:items-start">
      <div className="lg:col-span-2 space-y-4">
        {error ? (
          <div className="rounded-2xl p-6 text-sm" style={{ background: "rgba(225, 29, 72, 0.06)", border: "1px solid rgba(225, 29, 72, 0.20)", color: "var(--danger-color)" }}>
            {error}
          </div>
        ) : (
          <RoundCardSkeleton />
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
        <Skeleton className="h-64" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-24" />
        <NodeSkeleton />
        <Skeleton className="h-40" />
      </div>
    </div>
  );

  const requiredVotes = Math.ceil((Math.max(1, round.activeNodeCount) * 2) / 3);

  return (
    <div>
      {/* Winner banner */}
      {showBanner && winner && (
        <WinnerBanner
          winner={winner}
          prizeSOL={(Number(round.prizePoolLamports) * 0.8) / 1e9}
          roundId={round.roundId}
          onClose={() => setShowBanner(false)}
        />
      )}

      {/* Stats bar */}
      <StatsBar
        totalRounds={Number(round.roundId)}
        totalPaidSol={Number(totalPaidLamports) / 1e9}
        activePlayers={Number(round.ticketCount)}
        ticketsSoldToday={Number(round.ticketCount)}
      />

      <div className="max-w-5xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-5 lg:items-start">
        {/* Left — main lottery panel */}
        <div className="lg:col-span-2 space-y-4">
          {/* Round card */}
          <div
            className="rounded-2xl p-6"
            style={{
              background: "var(--surface-primary)",
              border: "1px solid rgba(99, 102, 241, 0.16)",
              boxShadow: round.status === 0 ? "var(--shadow-panel)" : "var(--shadow-card)",
              transition: "var(--transition)",
            }}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    round.status === 0
                      ? "bg-emerald-400 animate-pulse"
                      : round.status === 1
                      ? "bg-yellow-400 animate-pulse"
                      : "bg-zinc-500"
                  }`}
                />
                <span className="text-sm" style={{ color: "var(--text-secondary)", fontWeight: 500 }}>
                  {round.status === 0
                    ? "Round Open"
                    : round.status === 1
                    ? "Drawing in progress"
                    : "Round Closed"}
                </span>
              </div>
              <span className="text-xs font-mono" style={{ color: "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}>
                Round #{round.roundId.toString()}
              </span>
            </div>

            <PrizePool
              prizePoolLamports={round.prizePoolLamports}
              ticketCount={round.ticketCount}
              ticketPriceSol={Number(ticketPriceLamports) / 1e9}
            />

            {/* Countdown */}
            {round.status === 0 && (
              <div className="mt-6 text-center">
                <p className="text-xs uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)", fontWeight: 500, letterSpacing: "0.04em" }}>
                  Closes in
                </p>
                <p
                  className="text-3xl sm:text-4xl font-bold tabular-nums transition-colors duration-500"
                  style={{
                    color: countdown < 60000 ? "var(--danger-color)" : countdown < 120000 ? "#F59E0B" : "var(--purple-primary)",
                    textShadow: countdown < 60000 ? "0 0 12px rgba(225, 29, 72, 0.25)" : "none",
                    fontFamily: "var(--font-mono)",
                    fontWeight: 600,
                    letterSpacing: "-0.03em",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {formatCountdown(countdown)}
                </p>
                {countdown < 60000 && (
                  <p className="text-xs mt-1 animate-pulse" style={{ color: "var(--danger-color)" }}>Hurry — round closing soon!</p>
                )}
              </div>
            )}

            {/* Drawing state */}
            {round.status === 1 && (
              <div className="mt-6 flex items-center justify-center gap-3">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-2 h-2 rounded-full bg-yellow-400"
                      style={{
                        animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                      }}
                    />
                  ))}
                </div>
                <span className="text-sm text-yellow-500">
                  Nodes are deriving winner from SlotHash…
                </span>
              </div>
            )}

            {/* Winner reveal */}
            {winner && round.status === 2 && (
              <WinnerReveal
                winner={winner}
                prizeSOL={(Number(round.prizePoolLamports) * 0.8) / 1e9}
                roundId={round.roundId}
              />
            )}

            <div className="mt-6">
              <BuyTicketButton
                status={round.status}
                onBuy={handleBuy}
                connected={connected}
              />
            </div>

            {/* Viral share nudge */}
            {round.status === 0 && (
              <div
                className="mt-3 flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border"
                style={{ background: "var(--surface-secondary)", borderColor: "var(--border-soft)" }}
              >
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  More players = bigger jackpot
                </p>
                <ShareButton
                  text={`🎰 PRUVPOT Round #${round.roundId.toString()} is live — ${(Number(round.prizePoolLamports) / 1e9).toFixed(3)} SOL prize pool. Provably fair lottery on Solana. No trust required.`}
                  label="Invite friends"
                  variant="full"
                />
              </div>
            )}
          </div>

          {/* Live feed + verify side by side on md+ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <LiveFeed />
            <VerifyPanel
              roundId={round.roundId}
              endSlot={round.endSlot}
              ticketCount={round.ticketCount}
            />
          </div>

          <RoundHistory history={history} />
        </div>

        {/* Right — trust sidebar + chat */}
        <div className="lg:sticky lg:top-[56px] space-y-4 lg:max-h-[calc(100vh-72px)] lg:overflow-y-auto lg:pb-4">
          <AttestationBadge attestation={ATTESTATION} />

          <NodeConsensus
            nodes={DEVNET_NODES}
            votes={votes}
            required={requiredVotes}
            status={round.status}
          />

          {/* How it works — compact */}
          <div
            className="rounded-xl p-4 space-y-2 border"
            style={{ background: "var(--surface-primary)", borderColor: "var(--border-default)" }}
          >
            <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>How it works</h3>
            {[
              ["1", "Buy a ticket for 0.01 SOL"],
              ["2", "Round ends at a fixed Solana slot"],
              ["3", "Nodes derive winner from SlotHash"],
              ["4", "2/3 consensus required to finalize"],
              ["5", "80% prize auto-transferred on-chain"],
            ].map(([n, text]) => (
              <div key={n} className="flex gap-2.5 text-xs">
                <span
                  className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 font-mono text-[10px]"
                  style={{ background: "var(--surface-tertiary)", color: "var(--purple-primary)", border: "1px solid var(--border-soft)" }}
                >
                  {n}
                </span>
                <span style={{ color: "var(--text-muted)" }}>{text}</span>
              </div>
            ))}
          </div>

          <ReferralCard />

          {/* Live Chat — Twitch style */}
          <LiveChat
            roundId={round.roundId}
            winner={winner}
            countdown={countdown}
            status={round.status}
            sidebar
          />

          <div
            className="rounded-xl p-4 text-center"
            style={{ background: "rgba(124, 58, 237, 0.05)", border: "1px solid rgba(124, 58, 237, 0.15)" }}
          >
            <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>Powered by</p>
            <p className="text-sm font-bold" style={{ color: "var(--purple-primary)" }}>PRUV Protocol</p>
            <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--text-muted)" }}>
              Verifiable allocation layer for Solana. No trust required.
            </p>
            <a
              href="https://github.com/pruvnetwork/pruv"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-xs"
              style={{ color: "var(--purple-primary)" }}
            >
              github.com/pruvnetwork/pruv ↗
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
