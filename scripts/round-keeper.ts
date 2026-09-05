/**
 * round-keeper — single-pass round lifecycle check (GitHub Actions cron).
 *
 * The lifecycle logic lives in lib/keeper-core.ts and is shared with the
 * Vercel Cron route at app/api/keeper/route.ts. Keep it there, not here.
 *
 * Env:
 *   SOLANA_KEYPAIR   base64-encoded JSON keypair array
 *   RPC_URL          (optional, defaults to devnet)
 */

import { runKeeperPass, isTransient } from "../lib/keeper-core";

function log(msg: string) { console.log(`[${new Date().toISOString()}] ${msg}`); }

async function main() {
  const keypairB64 = process.env.SOLANA_KEYPAIR;
  if (!keypairB64) throw new Error("SOLANA_KEYPAIR env not set");

  const result = await runKeeperPass({
    keypairB64,
    rpcUrl: process.env.RPC_URL,
  });

  log(`done: ${result.action} (round #${result.roundId})`);
}

main().catch(err => {
  // Transient RPC errors — don't fail the CI run, retry on next cron tick
  if (isTransient(err)) {
    const msg = err instanceof Error ? err.message : String(err);
    log(`Transient RPC error (will retry next run): ${msg.slice(0, 120)}`);
    process.exit(0);
  }
  log(`Fatal: ${err}`);
  process.exit(1);
});
