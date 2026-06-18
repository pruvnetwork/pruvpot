import { NextResponse } from "next/server";
import { getMockRound, addTicket } from "@/lib/mock";

// TODO (post-deploy): replace with LotteryClient.buyTicket(wallet, roundId, count)
// Real flow: wallet signs tx client-side → broadcast → confirm → return txSig
export async function POST(req: Request) {
  let body: { wallet?: string; roundId?: string; count?: number };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { wallet, roundId, count = 1 } = body;

  if (!wallet || !roundId) {
    return NextResponse.json(
      { error: "Missing required fields: wallet, roundId" },
      { status: 400 }
    );
  }

  if (count < 1 || count > 10) {
    return NextResponse.json(
      { error: "count must be between 1 and 10" },
      { status: 400 }
    );
  }

  const round = getMockRound();

  if (round.status !== 0) {
    return NextResponse.json(
      { error: "Round is not open for ticket purchases" },
      { status: 409 }
    );
  }

  if (round.roundId.toString() !== roundId) {
    return NextResponse.json(
      { error: "Round ID mismatch" },
      { status: 409 }
    );
  }

  for (let i = 0; i < count; i++) addTicket();

  const updated = getMockRound();

  return NextResponse.json({
    success: true,
    wallet,
    roundId,
    count,
    ticketIndices: Array.from(
      { length: count },
      (_, i) => Number(updated.ticketCount) - count + i
    ),
    pricePerTicketLamports: 10_000_000,
    totalLamports: count * 10_000_000,
    // TODO (post-deploy): real txSig from confirmed Solana transaction
    txSig: `mock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  });
}
