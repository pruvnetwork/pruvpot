import { NextResponse } from "next/server";
import { runKeeperPass, isTransient } from "@/lib/keeper-core";

/**
 * Vercel Cron trigger for the round keeper.
 *
 * This exists because the GitHub Actions schedule is disabled automatically
 * after 60 days of repository inactivity — which is exactly how round #732 sat
 * expired-but-open for three weeks. Vercel Cron has no such failure mode, so it
 * is the primary trigger and the Actions workflow is the backup. Both call the
 * same idempotent pass, so running both is safe.
 *
 * Env:
 *   SOLANA_KEYPAIR   base64-encoded JSON keypair array (required)
 *   CRON_SECRET      shared secret; Vercel Cron sends it as a Bearer token
 *   NEXT_PUBLIC_RPC_URL / RPC_URL   RPC endpoint (optional)
 */

// anchor + web3.js need the Node runtime, and a pass can wait on RPC retries.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;

  // Without a secret this endpoint would let anyone burn the keeper wallet's
  // SOL by spamming initialize_round, so refuse to run rather than run open.
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: "CRON_SECRET not configured" },
      { status: 503 },
    );
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const keypairB64 = process.env.SOLANA_KEYPAIR;
  if (!keypairB64) {
    return NextResponse.json(
      { ok: false, error: "SOLANA_KEYPAIR not configured" },
      { status: 503 },
    );
  }

  try {
    const result = await runKeeperPass({
      keypairB64,
      rpcUrl: process.env.RPC_URL || process.env.NEXT_PUBLIC_RPC_URL,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const transient = isTransient(err);
    // Transient RPC trouble is expected; a 200 keeps it out of the error rate
    // while still recording what happened. The next tick retries.
    return NextResponse.json(
      { ok: false, transient, error: message.slice(0, 300) },
      { status: transient ? 200 : 500 },
    );
  }
}
