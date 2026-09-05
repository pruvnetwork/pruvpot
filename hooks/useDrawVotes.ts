"use client";

import { useEffect, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { getConnection } from "@/lib/rpc";
import { Program, AnchorProvider, BorshCoder, utils } from "@coral-xyz/anchor";
import IDL from "@/lib/idl/pruv_lottery.json";
import { PROGRAM_ID, u64LE } from "@/lib/lottery-client";
import type { DrawVoteInfo } from "@/lib/types";


const DUMMY_WALLET = {
  publicKey: PublicKey.default,
  signTransaction: async <T>(tx: T) => tx,
  signAllTransactions: async <T>(txs: T[]) => txs,
};

// DrawVote discriminator from IDL
const DRAW_VOTE_DISC = Buffer.from([120, 37, 90, 181, 89, 213, 219, 80]);

export function useDrawVotes(roundId: bigint | null | undefined): DrawVoteInfo[] {
  const [votes, setVotes] = useState<DrawVoteInfo[]>([]);

  useEffect(() => {
    if (roundId == null) return;
    let cancelled = false;

    async function fetch() {
      try {
        const conn = getConnection();
        const provider = new AnchorProvider(conn, DUMMY_WALLET as never, { commitment: "confirmed" });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const program = new Program(IDL as any, provider);
        const coder = new BorshCoder(IDL as never);

        const accounts = await conn.getProgramAccounts(PROGRAM_ID, {
          filters: [
            { memcmp: { offset: 0, bytes: utils.bytes.bs58.encode(DRAW_VOTE_DISC) } },
            { memcmp: { offset: 8, bytes: utils.bytes.bs58.encode(u64LE(roundId as bigint)) } },
          ],
        });

        if (cancelled) return;

        const result: DrawVoteInfo[] = accounts.map((acc) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const decoded = coder.accounts.decode<any>("DrawVote", acc.account.data);
          return {
            nodePubkey: (decoded.nodePubkey as PublicKey).toBase58(),
            winnerIndex: BigInt(decoded.winnerIndex.toString()),
            votedAt: Date.now(),
          };
        });

        setVotes(result);
      } catch {
        // silently ignore read errors
      }
    }

    fetch();
    const id = setInterval(fetch, 8_000);
    return () => { cancelled = true; clearInterval(id); };
  }, [roundId]);

  return votes;
}
