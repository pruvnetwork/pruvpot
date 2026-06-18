import { NextResponse } from "next/server";
import { MY_TICKETS } from "@/lib/mockData";

// TODO (post-deploy): replace with LotteryClient.fetchTicketsByOwner(wallet)
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ wallet: string }> }
) {
  const { wallet } = await params;

  // Mock: only the hardcoded wallet has ticket data
  const tickets = wallet === "9ZwL...kFpQ" ? MY_TICKETS : [];

  const won = tickets.filter(t => t.status === "won");
  const active = tickets.filter(t => t.status === "active");

  return NextResponse.json({
    wallet,
    tickets,
    stats: {
      total: tickets.length,
      active: active.length,
      won: won.length,
      lost: tickets.length - won.length - active.length,
      totalSpentSOL: tickets.length * 0.01,
      totalWonSOL: won.reduce((a, t) => a + (t.prizeSOL ?? 0), 0),
    },
  });
}
