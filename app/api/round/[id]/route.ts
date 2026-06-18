import { NextResponse } from "next/server";
import { getRoundDetail } from "@/lib/mockData";

// TODO (post-deploy): replace getRoundDetail() with LotteryClient.fetchRound(id)
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const roundId = Number(id);

  if (isNaN(roundId)) {
    return NextResponse.json({ error: "Invalid round ID" }, { status: 400 });
  }

  const round = getRoundDetail(roundId);

  if (!round) {
    return NextResponse.json({ error: "Round not found" }, { status: 404 });
  }

  return NextResponse.json({
    roundId: round.roundId,
    status: 2,
    ticketCount: round.ticketCount,
    prizePoolSOL: round.prizePoolSOL,
    winnerPrizeSOL: round.winnerPrizeSOL,
    winner: round.winner,
    winnerIndex: round.winnerIndex,
    finalSlot: round.finalSlot,
    closedAt: round.closedAt,
    slotHash: round.slotHash,
    txSig: round.txSig,
    nodeVotes: round.nodeVotes,
    tickets: round.tickets,
  });
}
