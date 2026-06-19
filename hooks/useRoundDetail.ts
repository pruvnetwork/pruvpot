"use client";

import { useEffect, useState } from "react";
import { Connection, PublicKey } from "@solana/web3.js";
import { AnchorProvider, Program, BorshCoder, utils } from "@coral-xyz/anchor";
import IDL from "@/lib/idl/pruv_lottery.json";
import { PROGRAM_ID, getConfigPDA, getLotteryStatePDA, u64LE } from "@/lib/lottery-client";

const RPC = process.env.NEXT_PUBLIC_RPC_URL ?? "https://api.devnet.solana.com";

const TICKET_DISC    = Buffer.from([41, 228, 24, 165, 78, 90, 235, 200]);
const DRAW_VOTE_DISC = Buffer.from([120, 37, 90, 181, 89, 213, 219, 80]);

const DUMMY_WALLET = {
  publicKey: PublicKey.default,
  signTransaction: async (tx: unknown) => tx,
  signAllTransactions: async (txs: unknown[]) => txs,
};

export interface RoundTicket {
  index: bigint;
  buyer: string;
  isWinner: boolean;
}

export interface RoundVote {
  node: string;
  winnerIndex: bigint;
  slotHash: string; // hex
  claimed: boolean;
}

export interface RoundDetail {
  roundId: bigint;
  status: number;
  ticketCount: bigint;
  endSlot: bigint;
  prizePoolLamports: bigint;
  ticketPriceLamports: bigint;
  winner: string | null;
  winnerIndex: bigint | null;
  tickets: RoundTicket[];
  votes: RoundVote[];
}

export interface RoundDetailState {
  detail: RoundDetail | null;
  loading: boolean;
  notFound: boolean;
}

export function useRoundDetail(roundId: number): RoundDetailState {
  const [state, setState] = useState<RoundDetailState>({ detail: null, loading: true, notFound: false });

  useEffect(() => {
    if (!roundId || isNaN(roundId)) { setState({ detail: null, loading: false, notFound: true }); return; }
    let cancelled = false;

    async function load() {
      try {
        const conn = new Connection(RPC, "confirmed");
        const provider = new AnchorProvider(conn, DUMMY_WALLET as never, { commitment: "confirmed" });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const program = new Program(IDL as any, provider);
        const coder = new BorshCoder(IDL as never);

        // Config for ticket price
        const [configPDA] = getConfigPDA();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const cfg: any = await (program.account as any).lotteryConfig.fetch(configPDA);
        const ticketPriceLamports = BigInt(cfg.ticketPriceLamports.toString());

        // Round state
        const rid = BigInt(roundId);
        const [statePDA] = getLotteryStatePDA(rid);
        let stateAcc: any;
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          stateAcc = await (program.account as any).lotteryState.fetch(statePDA);
        } catch {
          if (!cancelled) setState({ detail: null, loading: false, notFound: true });
          return;
        }

        const status = Number(stateAcc.status);
        const ticketCount = BigInt(stateAcc.ticketCount.toString());
        const endSlot = BigInt(stateAcc.endSlot.toString());
        const winnerKey: PublicKey = stateAcc.winner;
        const isZeroWinner = winnerKey.equals(PublicKey.default);
        const winner = isZeroWinner ? null : winnerKey.toBase58();
        const prizePoolLamports = ticketCount * ticketPriceLamports;

        // All tickets for this round
        const ticketAccs = await conn.getProgramAccounts(PROGRAM_ID, {
          filters: [
            { memcmp: { offset: 0, bytes: utils.bytes.bs58.encode(TICKET_DISC) } },
            { memcmp: { offset: 8, bytes: utils.bytes.bs58.encode(u64LE(rid)) } },
          ],
          dataSlice: { offset: 8, length: 49 },
        });

        const tickets: RoundTicket[] = ticketAccs.map(({ account }) => {
          const data = account.data;
          const buyer = new PublicKey(data.slice(8, 40)).toBase58();
          const index = new DataView(data.buffer, data.byteOffset + 40).getBigUint64(0, true);
          return { index, buyer, isWinner: false };
        }).sort((a, b) => Number(a.index - b.index));

        // Draw votes for this round
        const voteAccs = await conn.getProgramAccounts(PROGRAM_ID, {
          filters: [
            { memcmp: { offset: 0, bytes: utils.bytes.bs58.encode(DRAW_VOTE_DISC) } },
            { memcmp: { offset: 8, bytes: utils.bytes.bs58.encode(u64LE(rid)) } },
          ],
        });

        let winnerIndex: bigint | null = null;
        const votes: RoundVote[] = voteAccs.map(({ account }) => {
          const decoded = coder.accounts.decode<any>("DrawVote", account.data);
          const wi = BigInt(decoded.winnerIndex.toString());
          if (winnerIndex === null) winnerIndex = wi;
          const slotHashBytes: number[] = decoded.slotHashUsed;
          const slotHash = Buffer.from(slotHashBytes).toString("hex");
          return {
            node: (decoded.nodePubkey as PublicKey).toBase58(),
            winnerIndex: wi,
            slotHash,
            claimed: Boolean(decoded.claimed),
          };
        });

        // Mark winner ticket
        if (winnerIndex !== null) {
          const wi = winnerIndex;
          tickets.forEach(t => { if (t.index === wi) t.isWinner = true; });
        }

        const detail: RoundDetail = {
          roundId: rid, status, ticketCount, endSlot,
          prizePoolLamports, ticketPriceLamports,
          winner, winnerIndex, tickets, votes,
        };

        if (!cancelled) setState({ detail, loading: false, notFound: false });
      } catch {
        if (!cancelled) setState({ detail: null, loading: false, notFound: true });
      }
    }

    load();
    const id = setInterval(load, 15_000);
    return () => { cancelled = true; clearInterval(id); };
  }, [roundId]);

  return state;
}
