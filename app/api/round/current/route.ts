import { NextResponse } from "next/server";
import { getMockRound, getRoundCountdown } from "@/lib/mock";

// TODO (post-deploy): replace getMockRound() with LotteryClient.fetchRound(currentRoundId)
export async function GET() {
  const round = getMockRound();
  const countdown = getRoundCountdown();

  return NextResponse.json({
    roundId: round.roundId.toString(),
    status: round.status,             // 0 = open, 1 = voting, 2 = finalized
    ticketCount: round.ticketCount.toString(),
    prizePoolLamports: round.prizePoolLamports.toString(),
    prizePoolSOL: Number(round.prizePoolLamports) / 1e9,
    startSlot: round.startSlot.toString(),
    endSlot: round.endSlot.toString(),
    activeNodeCount: round.activeNodeCount,
    voteCount: round.voteCount,
    thresholdBps: round.thresholdBps.toString(),
    winner: round.winner,
    countdownMs: countdown,
  });
}
