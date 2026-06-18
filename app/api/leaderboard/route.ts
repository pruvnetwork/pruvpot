import { NextResponse } from "next/server";
import { LEADERBOARD } from "@/lib/mockData";

// TODO (post-deploy): replace with on-chain derived leaderboard from indexed ticket/win history
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? 50), 100);

  return NextResponse.json({
    leaderboard: LEADERBOARD.slice(0, limit),
    total: LEADERBOARD.length,
  });
}
