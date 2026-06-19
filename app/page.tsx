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
import { MOCK_ATTESTATION, MOCK_NODES, MOCK_HISTORY } from "@/lib/mock";
import { formatCountdown } from "@/lib/utils";
import type { DrawVoteInfo } from "@/lib/types";
import { buyTicket } from "@/lib/lottery-client";
import { useLotteryState } from "@/hooks/useLotteryState";

export default function Home() {
  const { round, countdown, ticketPriceLamports, loading, error } = useLotteryState();

  const votes: DrawVoteInfo[] = []; // real votes via DrawVote accounts — future work
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
          <div className="border border-red-900 bg-red-950/30 rounded-2xl p-6 text-red-400 text-sm">
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

  const requiredVotes = Math.ceil((round.activeNodeCount * 2) / 3);

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
        totalRounds={41}
        totalPaidSol={2.05}
        activePlayers={134}
        ticketsSoldToday={Number(round.ticketCount)}
      />

      <div className="max-w-5xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-5 lg:items-start">
        {/* Left — main lottery panel */}
        <div className="lg:col-span-2 space-y-4">
          {/* Round card */}
          <div
            className="border border-zinc-800 bg-zinc-900/60 rounded-2xl p-6"
            style={{ boxShadow: round.status === 0 ? "0 0 40px rgba(139,92,246,0.06)" : "none" }}
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
                <span className="text-sm text-zinc-400">
                  {round.status === 0
                    ? "Round Open"
                    : round.status === 1
                    ? "Drawing in progress"
                    : "Round Closed"}
                </span>
              </div>
              <span className="text-xs text-zinc-600 font-mono">
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
                <p className="text-xs text-zinc-600 uppercase tracking-widest mb-2">
                  Closes in
                </p>
                <p
                  className="text-3xl sm:text-4xl font-mono font-bold tabular-nums transition-colors duration-500"
                  style={{
                    color: countdown < 60000 ? "#f87171" : countdown < 120000 ? "#fbbf24" : "#e4e4e7",
                    textShadow: countdown < 60000 ? "0 0 20px rgba(248,113,113,0.4)" : "none",
                  }}
                >
                  {formatCountdown(countdown)}
                </p>
                {countdown < 60000 && (
                  <p className="text-xs text-red-500 mt-1 animate-pulse">Hurry — round closing soon!</p>
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
              <div className="mt-3 flex items-center justify-between gap-3 px-3 py-2.5 bg-zinc-800/40 rounded-xl border border-zinc-800">
                <p className="text-xs text-zinc-500">
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

          <RoundHistory history={MOCK_HISTORY} />
        </div>

        {/* Right — trust sidebar + chat */}
        <div className="lg:sticky lg:top-[56px] space-y-4 lg:max-h-[calc(100vh-72px)] lg:overflow-y-auto lg:pb-4">
          <AttestationBadge attestation={MOCK_ATTESTATION} />

          <NodeConsensus
            nodes={MOCK_NODES}
            votes={votes}
            required={requiredVotes}
            status={round.status}
          />

          {/* How it works — compact */}
          <div className="border border-zinc-800 bg-zinc-900/50 rounded-xl p-4 space-y-2">
            <h3 className="text-sm font-semibold text-zinc-200">How it works</h3>
            {[
              ["1", "Buy a ticket for 0.01 SOL"],
              ["2", "Round ends at a fixed Solana slot"],
              ["3", "Nodes derive winner from SlotHash"],
              ["4", "2/3 consensus required to finalize"],
              ["5", "80% prize auto-transferred on-chain"],
            ].map(([n, text]) => (
              <div key={n} className="flex gap-2.5 text-xs">
                <span className="w-4 h-4 rounded-full bg-zinc-800 text-zinc-500 flex items-center justify-center flex-shrink-0 font-mono text-[10px]">
                  {n}
                </span>
                <span className="text-zinc-500">{text}</span>
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

          <div className="border border-violet-900 bg-violet-950/30 rounded-xl p-4 text-center">
            <p className="text-xs text-zinc-500 mb-1">Powered by</p>
            <p className="text-sm font-bold text-violet-300">PRUV Protocol</p>
            <p className="text-xs text-zinc-600 mt-1 leading-relaxed">
              Verifiable allocation layer for Solana. No trust required.
            </p>
            <a
              href="https://github.com/pruvnetwork/pruv"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-xs text-violet-500 hover:text-violet-400"
            >
              github.com/pruvnetwork/pruv ↗
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
