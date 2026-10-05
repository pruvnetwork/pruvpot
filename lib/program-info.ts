"use client";

import { Connection, PublicKey } from "@solana/web3.js";
import { PROGRAM_ID } from "./lottery-client";

const BPF_UPGRADEABLE_LOADER = new PublicKey("BPFLoaderUpgradeab1e11111111111111111111111");

export interface ProgramInfo {
  programId: string;
  /** null = immutable (upgrade authority revoked); undefined = could not read. */
  upgradeAuthority: string | null | undefined;
  lastDeployedSlot?: number;
}

/**
 * Who can change the program's bytecode. Read from the BPF upgradeable loader's
 * ProgramData account: [u32 tag=3][u64 slot][u8 has_authority][pubkey].
 */
export async function fetchProgramInfo(conn: Connection): Promise<ProgramInfo> {
  const base: ProgramInfo = { programId: PROGRAM_ID.toBase58(), upgradeAuthority: undefined };
  try {
    const prog = await conn.getAccountInfo(PROGRAM_ID, "confirmed");
    if (!prog || !prog.owner.equals(BPF_UPGRADEABLE_LOADER) || prog.data.length < 36) return base;
    const programData = new PublicKey(prog.data.subarray(4, 36));
    const pd = await conn.getAccountInfo(programData, "confirmed");
    if (!pd || pd.data.length < 13) return base;
    const slot = Number(new DataView(pd.data.buffer, pd.data.byteOffset + 4, 8).getBigUint64(0, true));
    const hasAuthority = pd.data[12] === 1;
    const authority = hasAuthority && pd.data.length >= 45 ? new PublicKey(pd.data.subarray(13, 45)).toBase58() : null;
    return { ...base, upgradeAuthority: authority, lastDeployedSlot: slot };
  } catch {
    return base;
  }
}
