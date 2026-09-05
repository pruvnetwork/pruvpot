"use client";

import { useEffect, useRef, useState } from "react";
import { Connection, PublicKey } from "@solana/web3.js";
import { PROGRAM_ID } from "@/lib/lottery-client";
import { rpcEndpoint, rpcWsEndpoint } from "@/lib/rpc";

// Event discriminators from IDL (first 8 bytes of SHA256("event:<Name>"))
const DISC = {
  TicketPurchased: Buffer.from([108, 59, 246, 95, 84, 145, 13, 71]),
  DrawVoteCast:    Buffer.from([81, 171, 255, 241, 149, 71, 84, 58]),
  RoundFinalized:  Buffer.from([43, 187, 17, 193, 36, 241, 48, 82]),
  RoundOpened:     Buffer.from([99, 173, 228, 72, 142, 57, 109, 178]),
};

export type OnChainEvent =
  | { type: "TicketPurchased"; roundId: bigint; buyer: string; index: bigint; ts: number }
  | { type: "DrawVoteCast";    roundId: bigint; node: string; voteCount: number; ts: number }
  | { type: "RoundFinalized";  roundId: bigint; winner: string; winnerShare: bigint; ts: number }
  | { type: "RoundOpened";     roundId: bigint; ts: number };

function matchDisc(buf: Buffer, disc: Buffer): boolean {
  if (buf.length < 8) return false;
  for (let i = 0; i < 8; i++) if (buf[i] !== disc[i]) return false;
  return true;
}

function parseEvent(data: Buffer, ts: number): OnChainEvent | null {
  try {
    if (matchDisc(data, DISC.TicketPurchased) && data.length >= 56) {
      const view = new DataView(data.buffer, data.byteOffset + 8);
      const roundId = view.getBigUint64(0, true);
      const buyer = new PublicKey(data.slice(16, 48)).toBase58();
      const index = view.getBigUint64(40, true);
      return { type: "TicketPurchased", roundId, buyer, index, ts };
    }
    if (matchDisc(data, DISC.DrawVoteCast) && data.length >= 57) {
      const view = new DataView(data.buffer, data.byteOffset + 8);
      const roundId = view.getBigUint64(0, true);
      const node = new PublicKey(data.slice(16, 48)).toBase58();
      const voteCount = data[56];
      return { type: "DrawVoteCast", roundId, node, voteCount, ts };
    }
    if (matchDisc(data, DISC.RoundFinalized) && data.length >= 81) {
      const view = new DataView(data.buffer, data.byteOffset + 8);
      const roundId = view.getBigUint64(0, true);
      const winner = new PublicKey(data.slice(16, 48)).toBase58();
      const winnerShare = view.getBigUint64(48, true);
      return { type: "RoundFinalized", roundId, winner, winnerShare, ts };
    }
    if (matchDisc(data, DISC.RoundOpened) && data.length >= 32) {
      const view = new DataView(data.buffer, data.byteOffset + 8);
      const roundId = view.getBigUint64(0, true);
      return { type: "RoundOpened", roundId, ts };
    }
  } catch { /* malformed */ }
  return null;
}

function parseLogsForEvents(logs: string[], ts: number): OnChainEvent[] {
  const events: OnChainEvent[] = [];
  for (const log of logs) {
    // Anchor emits: "Program data: <base64>"
    if (!log.startsWith("Program data: ")) continue;
    try {
      const b64 = log.slice("Program data: ".length).trim();
      const data = Buffer.from(b64, "base64");
      const ev = parseEvent(data, ts);
      if (ev) events.push(ev);
    } catch { /* skip */ }
  }
  return events;
}

// Backfill: fetch recent signatures and parse their logs
async function backfill(conn: Connection, limit = 15): Promise<OnChainEvent[]> {
  const sigs = await conn.getSignaturesForAddress(PROGRAM_ID, { limit });
  const events: OnChainEvent[] = [];
  await Promise.allSettled(
    sigs.map(async ({ signature, blockTime }) => {
      const tx = await conn.getTransaction(signature, {
        commitment: "confirmed",
        maxSupportedTransactionVersion: 0,
      });
      if (!tx?.meta?.logMessages) return;
      const ts = blockTime ? blockTime * 1000 : Date.now();
      const evs = parseLogsForEvents(tx.meta.logMessages, ts);
      events.push(...evs);
    })
  );
  // Sort oldest first so they appear in time order
  return events.sort((a, b) => a.ts - b.ts);
}

export function useOnChainEvents(maxEvents = 40): OnChainEvent[] {
  const [events, setEvents] = useState<OnChainEvent[]>([]);
  const connRef = useRef<Connection | null>(null);
  const subRef = useRef<number | null>(null);

  useEffect(() => {
    const conn = new Connection(rpcEndpoint(), { commitment: "confirmed", wsEndpoint: rpcWsEndpoint() });
    connRef.current = conn;

    // Backfill recent history first
    backfill(conn).then(evs => {
      if (evs.length > 0) setEvents(evs.slice(-maxEvents));
    }).catch(() => {});

    // Subscribe to live logs
    subRef.current = conn.onLogs(
      PROGRAM_ID,
      ({ logs, err }) => {
        if (err) return;
        const ts = Date.now();
        const evs = parseLogsForEvents(logs, ts);
        if (evs.length === 0) return;
        setEvents(prev => [...prev, ...evs].slice(-maxEvents));
      },
      "confirmed"
    );

    return () => {
      if (subRef.current !== null) {
        conn.removeOnLogsListener(subRef.current).catch(() => {});
        subRef.current = null;
      }
    };
  }, [maxEvents]);

  return events;
}
