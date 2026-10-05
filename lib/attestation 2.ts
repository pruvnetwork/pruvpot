"use client";

/**
 * PRUV attestation for this program, read straight from the pruv-attestation
 * program's accounts (no SDK, hand-decoded so the layout is visible here).
 *
 * Attestation PDA ["attestation", dapp_program_id]:
 *   8 disc | 32 dapp | 1 type | 32 program_hash | 32 proof_hash | 8 slot | 8 created_at
 *   | 8 expires_at | 1 signer_count | 1 valid | 1 bump
 * Config PDA ["attest_config"]:
 *   8 disc | 32 authority | 4 active_node_count | 8 total | 1 bump
 *   | 32 verifier_program | 32 code_integrity_vk_hash        (last two: newer layout only)
 */

import { Connection, PublicKey } from "@solana/web3.js";

export const ATTESTATION_PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_ATTESTATION_PROGRAM_ID ?? "8P1vjkTueMRwrTsYPbGh2cdppz39CwQHcosRuXopL8VQ",
);

export interface AttestationInfo {
  address: string;
  programHash: string; // hex, SHA-256 of the bytecode the node attested
  proofHash: string;   // hex, keccak256 (new) / sha256 (legacy) of the Halo2 proof
  slot: number;
  createdAt: number;   // unix seconds
  expiresAt: number;
  signerCount: number;
  valid: boolean;
}

export interface AttestationConfigInfo {
  activeNodeCount: number;
  /** null = on-chain ZK verification gate not configured (hash-only attestations). */
  verifierProgram: string | null;
  codeIntegrityVkHash: string | null;
}

const hex = (b: Uint8Array) => Array.from(b).map((x) => x.toString(16).padStart(2, "0")).join("");

export function getAttestationPDA(dapp: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync([Buffer.from("attestation"), dapp.toBuffer()], ATTESTATION_PROGRAM_ID)[0];
}

export async function fetchAttestation(conn: Connection, dapp: PublicKey): Promise<AttestationInfo | null> {
  const pda = getAttestationPDA(dapp);
  const acc = await conn.getAccountInfo(pda, "confirmed");
  if (!acc || !acc.owner.equals(ATTESTATION_PROGRAM_ID) || acc.data.length < 131) return null;
  const d = acc.data;
  const view = new DataView(d.buffer, d.byteOffset, d.byteLength);
  return {
    address: pda.toBase58(),
    programHash: hex(d.subarray(41, 73)),
    proofHash: hex(d.subarray(73, 105)),
    slot: Number(view.getBigUint64(105, true)),
    createdAt: Number(view.getBigInt64(113, true)),
    expiresAt: Number(view.getBigInt64(121, true)),
    signerCount: d[129],
    valid: d[130] === 1,
  };
}

export async function fetchAttestationConfig(conn: Connection): Promise<AttestationConfigInfo | null> {
  const [pda] = PublicKey.findProgramAddressSync([Buffer.from("attest_config")], ATTESTATION_PROGRAM_ID);
  const acc = await conn.getAccountInfo(pda, "confirmed");
  if (!acc || acc.data.length < 53) return null;
  const d = acc.data;
  const view = new DataView(d.buffer, d.byteOffset, d.byteLength);
  const activeNodeCount = view.getUint32(40, true);
  const hasVerifier = d.length >= 53 + 64;
  const verifier = hasVerifier ? new PublicKey(d.subarray(53, 85)) : null;
  const verifierProgram = verifier && !verifier.equals(PublicKey.default) ? verifier.toBase58() : null;
  return {
    activeNodeCount,
    verifierProgram,
    codeIntegrityVkHash: verifierProgram ? hex(d.subarray(85, 117)) : null,
  };
}
