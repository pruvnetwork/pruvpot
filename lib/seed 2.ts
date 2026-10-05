/**
 * (Verbatim copy of pruv/sdk/src/seed.ts — keep the two files identical.)
 * PRUV draw seed — reference TypeScript implementation.
 *
 * Mirrors `programs/pruv-lottery/src/lib.rs` byte for byte. Spec:
 *
 *   window      = slots end_slot .. end_slot + SEED_WINDOW_SLOTS (8)
 *   h_i         = SlotHashes[end_slot + i]   (32 bytes; 32 zero bytes if the slot was skipped)
 *   f_i         = h_i with byte 31 set to 0  (little-endian BN254 field element < 2^248)
 *   seed        = Poseidon_BN254(f_0..f_7, round_id, ticket_count)   // Circom parameters, 10 inputs
 *                 round_id and ticket_count are 32-byte little-endian integers
 *                 output is the 32-byte little-endian encoding of the field element
 *   winner_idx  = u64_le(seed[0..8]) mod ticket_count
 *
 * Poseidon comes from `poseidon-lite` (circomlib constants), which agrees with
 * Solana's `sol_poseidon` syscall (`Bn254X5`, little endian) used on-chain.
 * This file has no Node-only dependencies so the same code runs in a browser.
 */

import * as PL from "poseidon-lite";
import type { Connection } from "@solana/web3.js";
import { SYSVAR_SLOT_HASHES_PUBKEY } from "@solana/web3.js";

// poseidon-lite is CommonJS; tolerate both interop shapes.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const poseidon10: (inputs: bigint[]) => bigint = (PL as any).poseidon10 ?? (PL as any).default?.poseidon10;

export const SEED_WINDOW_SLOTS = 8;

export interface SlotHashEntry {
  slot: bigint;
  hash: Uint8Array;
}

export interface SeedWindow {
  firstSlot: bigint;
  /** Exactly SEED_WINDOW_SLOTS entries; a skipped slot is 32 zero bytes. */
  hashes: Uint8Array[];
  /** bit i set ⇔ slot firstSlot+i was produced. */
  presentMask: number;
}

export class SeedWindowNotComplete extends Error {}
export class SeedExpired extends Error {}

export function leBytesToBigInt(b: Uint8Array): bigint {
  let x = 0n;
  for (let i = b.length - 1; i >= 0; i--) x = (x << 8n) | BigInt(b[i]);
  return x;
}

export function bigIntToLeBytes(x: bigint, len = 32): Uint8Array {
  const out = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    out[i] = Number(x & 0xffn);
    x >>= 8n;
  }
  return out;
}

/** Parse the SlotHashes sysvar: [u64 count] then count × ([u64 slot][32-byte hash]), newest first. */
export function parseSlotHashes(data: Uint8Array): SlotHashEntry[] {
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const count = Math.min(Number(view.getBigUint64(0, true)), 512);
  const out: SlotHashEntry[] = [];
  for (let i = 0; i < count; i++) {
    const off = 8 + i * 40;
    if (off + 40 > data.byteLength) break;
    out.push({ slot: view.getBigUint64(off, true), hash: data.slice(off + 8, off + 40) });
  }
  return out;
}

/** Mirror of the program's `read_seed_window`. */
export function readSeedWindow(sysvarData: Uint8Array, firstSlot: bigint): SeedWindow {
  const entries = parseSlotHashes(sysvarData);
  if (entries.length === 0) throw new Error("SlotHashes sysvar is empty");
  const newest = entries[0].slot;
  const oldest = entries[entries.length - 1].slot;
  const lastSlot = firstSlot + BigInt(SEED_WINDOW_SLOTS - 1);
  if (newest < lastSlot) throw new SeedWindowNotComplete(`sysvar newest slot ${newest} < window end ${lastSlot}`);
  if (firstSlot < oldest) throw new SeedExpired(`window start ${firstSlot} rotated out (oldest ${oldest})`);
  const hashes: Uint8Array[] = Array.from({ length: SEED_WINDOW_SLOTS }, () => new Uint8Array(32));
  let presentMask = 0;
  for (const e of entries) {
    if (e.slot < firstSlot) break;
    if (e.slot > lastSlot) continue;
    const k = Number(e.slot - firstSlot);
    hashes[k] = e.hash;
    presentMask |= 1 << k;
  }
  if (presentMask === 0) throw new SeedExpired("no slot of the window was produced");
  return { firstSlot, hashes, presentMask };
}

export async function fetchSeedWindow(
  conn: Connection,
  firstSlot: bigint,
  commitment: "processed" | "confirmed" | "finalized" = "confirmed",
): Promise<SeedWindow> {
  const info = await conn.getAccountInfo(SYSVAR_SLOT_HASHES_PUBKEY, commitment);
  if (!info) throw new Error("SlotHashes sysvar not found");
  return readSeedWindow(new Uint8Array(info.data), firstSlot);
}

/** Mirror of the program's `compute_seed`. */
export function computeSeed(hashes: Uint8Array[], roundId: bigint, ticketCount: bigint): Uint8Array {
  if (hashes.length !== SEED_WINDOW_SLOTS) throw new Error(`expected ${SEED_WINDOW_SLOTS} hashes`);
  const inputs: bigint[] = hashes.map((h) => {
    if (h.length !== 32) throw new Error("slot hash must be 32 bytes");
    const f = h.slice();
    f[31] = 0;
    return leBytesToBigInt(f);
  });
  inputs.push(roundId, ticketCount);
  return bigIntToLeBytes(poseidon10(inputs), 32);
}

/** Mirror of the program's `derive_winner_index`. */
export function deriveWinnerIndex(seed: Uint8Array, ticketCount: bigint): bigint {
  if (ticketCount <= 0n) throw new Error("ticketCount must be > 0");
  return leBytesToBigInt(seed.slice(0, 8)) % ticketCount;
}

export const toHex = (b: Uint8Array | number[]): string =>
  Array.from(b).map((x) => x.toString(16).padStart(2, "0")).join("");
