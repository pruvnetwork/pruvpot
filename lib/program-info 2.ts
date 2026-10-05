"use client";

import { Connection, PublicKey } from "@solana/web3.js";
import { PROGRAM_ID } from "./lottery-client";

const BPF_UPGRADEABLE_LOADER = new PublicKey("BPFLoaderUpgradeab1e11111111111111111111111");

export interface ProgramInfo {
  programId: string;
  /** null = immutable (upgrade authority revoked); undefined = could not read. */
  upgradeAuthority: string | null | undefined;
  lastDeployedSlot?: number;
  /** SHA-256 of the running bytecode (ProgramData minus the 45-byte loader header), as PRUV nodes hash it. */
  bytecodeSha256?: string;
}

const hex = (b: Uint8Array) => Array.from(b).map((x) => x.toString(16).padStart(2, "0")).join("");
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Who can change the program's bytecode and what that bytecode hashes to.
 * One ProgramData fetch ([u32 tag=3][u64 slot][u8 has_authority][pubkey][bytecode…]),
 * retried with backoff because the public devnet RPC rate-limits bursts (429).
 */
export async function fetchProgramInfo(conn: Connection, programId: PublicKey = PROGRAM_ID): Promise<ProgramInfo> {
  const base: ProgramInfo = { programId: programId.toBase58(), upgradeAuthority: undefined };
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const prog = await conn.getAccountInfo(programId, "confirmed");
      if (!prog || !prog.owner.equals(BPF_UPGRADEABLE_LOADER) || prog.data.length < 36) return base;
      const programData = new PublicKey(prog.data.subarray(4, 36));
      const pd = await conn.getAccountInfo(programData, "confirmed");
      if (!pd || pd.data.length < 45) return base;
      const slot = Number(new DataView(pd.data.buffer, pd.data.byteOffset + 4, 8).getBigUint64(0, true));
      const hasAuthority = pd.data[12] === 1;
      const authority = hasAuthority ? new PublicKey(pd.data.subarray(13, 45)).toBase58() : null;
      const digest = await crypto.subtle.digest("SHA-256", Uint8Array.from(pd.data.subarray(45)));
      return { ...base, upgradeAuthority: authority, lastDeployedSlot: slot, bytecodeSha256: hex(new Uint8Array(digest)) };
    } catch {
      await sleep(1500 * (attempt + 1)); // 429 on the public RPC: back off and try again
    }
  }
  return base;
}
