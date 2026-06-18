import { NextResponse } from "next/server";
import { ROUND_STATS, TOTAL_STATS } from "@/lib/mockData";

// TODO (post-deploy): replace with LotteryClient.fetchRoundHistory(limit, offset)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? 20), 100);
  const offset = Number(searchParams.get("offset") ?? 0);

  const page = ROUND_STATS.slice(offset, offset + limit);

  return NextResponse.json({
    rounds: page,
    total: ROUND_STATS.length,
    limit,
    offset,
    stats: TOTAL_STATS,
  });
}
