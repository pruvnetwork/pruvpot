/**
 * set-round-duration — adjust `round_duration_slots` via update_config.
 *
 * Why this exists: slot time is not fixed. At the ~165ms/slot devnet has been
 * running, the configured 1800 slots is only ~5 minutes, which is shorter than
 * the interval any free scheduler can reliably hit the keeper at. Rounds expire
 * before the keeper comes back, so the buy window is closed most of the time.
 * This script sizes the round in MINUTES and converts using the measured rate.
 *
 * Dry run (default — reads only, sends nothing):
 *   npx ts-node --compiler-options '{"module":"commonjs","esModuleInterop":true,"resolveJsonModule":true}' \
 *     scripts/set-round-duration.ts --minutes 15
 *
 * Apply:
 *   ... scripts/set-round-duration.ts --minutes 15 --apply
 *
 * Signer must be the config authority. Provide it with either:
 *   --keypair <path>        Solana CLI keypair JSON (default ~/.config/solana/id.json)
 *   SOLANA_KEYPAIR=<base64> base64 of that same JSON array
 *
 * NOTE: the authority is NOT the same key as the round keeper. The keeper only
 * signs initialize_round, which takes any payer; update_config requires the
 * authority recorded in the config account.
 *
 * Options:
 *   --minutes <n>   target round length in minutes (converted via measured slot rate)
 *   --slots <n>     set slots directly, skipping the conversion
 *   --rpc <url>     RPC endpoint (default $RPC_URL, else public devnet)
 *   --apply         actually send the transaction
 */

import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as anchor from "@coral-xyz/anchor";
import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  VersionedTransaction,
} from "@solana/web3.js";
import IDL from "../lib/idl/pruv_lottery.json";

const PROG_ID = new PublicKey("HxoYg9RGSK4J7bbFkuUuPXiJqonKD9g5Dx6FiaBSVpob");
const FALLBACK_MS_PER_SLOT = 400;

// anchor.Wallet only exists in the CJS build; keep this script self-contained.
class KeypairWallet implements anchor.Wallet {
  constructor(readonly payer: Keypair) {}
  get publicKey() { return this.payer.publicKey; }
  async signTransaction<T extends Transaction | VersionedTransaction>(tx: T): Promise<T> {
    if (tx instanceof VersionedTransaction) tx.sign([this.payer]);
    else tx.partialSign(this.payer);
    return tx;
  }
  async signAllTransactions<T extends Transaction | VersionedTransaction>(txs: T[]): Promise<T[]> {
    return Promise.all(txs.map(t => this.signTransaction(t)));
  }
}

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? undefined : process.argv[i + 1];
}
const hasFlag = (name: string) => process.argv.includes(`--${name}`);

function loadAuthority(): Keypair {
  const b64 = process.env.SOLANA_KEYPAIR;
  if (b64) {
    return Keypair.fromSecretKey(
      Uint8Array.from(JSON.parse(Buffer.from(b64, "base64").toString())),
    );
  }
  const file = arg("keypair") ?? path.join(os.homedir(), ".config/solana/id.json");
  if (!fs.existsSync(file)) {
    throw new Error(
      `No keypair found. Pass --keypair <path> or set SOLANA_KEYPAIR (base64). Looked at: ${file}`,
    );
  }
  return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync(file, "utf8"))));
}

/** Sample the cluster to find out how long a slot actually takes right now. */
async function measureMsPerSlot(conn: Connection): Promise<number> {
  try {
    const samples = await conn.getRecentPerformanceSamples(5);
    let slots = 0, secs = 0;
    for (const s of samples) {
      if (s.numSlots > 0 && s.samplePeriodSecs > 0) { slots += s.numSlots; secs += s.samplePeriodSecs; }
    }
    if (!slots) return FALLBACK_MS_PER_SLOT;
    const ms = (secs * 1000) / slots;
    return Number.isFinite(ms) && ms >= 50 && ms <= 2000 ? ms : FALLBACK_MS_PER_SLOT;
  } catch {
    return FALLBACK_MS_PER_SLOT;
  }
}

async function main() {
  const minutesArg = arg("minutes");
  const slotsArg   = arg("slots");
  if (!minutesArg && !slotsArg) throw new Error("Pass --minutes <n> or --slots <n>");
  if (minutesArg && slotsArg)   throw new Error("Pass only one of --minutes / --slots");

  const rpc  = arg("rpc") ?? process.env.RPC_URL ?? "https://api.devnet.solana.com";
  const conn = new Connection(rpc, "confirmed");
  const authority = loadAuthority();

  const [configPDA] = PublicKey.findProgramAddressSync([Buffer.from("lottery_config")], PROG_ID);
  const provider = new anchor.AnchorProvider(conn, new KeypairWallet(authority), {
    commitment: "confirmed",
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const program = new anchor.Program(IDL as any, provider);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cfg: any = await (program.account as any).lotteryConfig.fetch(configPDA);

  const onChainAuthority = (cfg.authority as PublicKey).toBase58();
  const currentSlots     = Number(cfg.roundDurationSlots.toString());
  const msPerSlot        = await measureMsPerSlot(conn);

  const targetSlots = slotsArg
    ? Number(slotsArg)
    : Math.round((Number(minutesArg) * 60_000) / msPerSlot);

  if (!Number.isFinite(targetSlots) || targetSlots <= 0) {
    throw new Error(`Computed an invalid duration: ${targetSlots} slots`);
  }

  const mins = (s: number) => ((s * msPerSlot) / 60_000).toFixed(1);

  console.log(`RPC              : ${rpc}`);
  console.log(`config PDA       : ${configPDA.toBase58()}`);
  console.log(`measured slot    : ${msPerSlot.toFixed(0)} ms/slot`);
  console.log("");
  console.log(`current duration : ${currentSlots} slots  (~${mins(currentSlots)} min)`);
  console.log(`new duration     : ${targetSlots} slots  (~${mins(targetSlots)} min)`);
  console.log("");
  console.log(`config.authority : ${onChainAuthority}`);
  console.log(`signer           : ${authority.publicKey.toBase58()}`);

  if (onChainAuthority !== authority.publicKey.toBase58()) {
    throw new Error(
      "Signer is not the config authority — update_config would fail with Unauthorized.\n" +
      "  The round keeper's key is NOT the authority; it only signs initialize_round.\n" +
      `  Supply the keypair for ${onChainAuthority}.`,
    );
  }

  const balance = await conn.getBalance(authority.publicKey);
  console.log(`signer balance   : ${(balance / 1e9).toFixed(4)} SOL`);

  if (currentSlots === targetSlots) {
    console.log("\nAlready set to this value — nothing to do.");
    return;
  }

  if (!hasFlag("apply")) {
    console.log("\nDRY RUN — nothing sent. Re-run with --apply to write this on-chain.");
    return;
  }

  // Only round duration changes; the other three stay null so they are untouched.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sig: string = await (program.methods as any)
    .updateConfig(null, null, null, new anchor.BN(targetSlots))
    .accounts({ config: configPDA, authority: authority.publicKey })
    .signers([authority])
    .rpc({ skipPreflight: false, maxRetries: 3 });

  console.log(`\nupdate_config: ${sig}`);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const after: any = await (program.account as any).lotteryConfig.fetch(configPDA);
  const now = Number(after.roundDurationSlots.toString());
  console.log(`verified on-chain: round_duration_slots = ${now} (~${mins(now)} min)`);
  if (now !== targetSlots) throw new Error("Read-back mismatch — the write did not take effect.");
  console.log("\nTakes effect from the next round the keeper opens.");
}

main().catch(err => {
  console.error(`\n${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
