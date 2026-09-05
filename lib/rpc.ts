"use client";

import { Connection } from "@solana/web3.js";

/**
 * Shared RPC endpoint selection with failover.
 *
 * Every hook used to inline `process.env.NEXT_PUBLIC_RPC_URL ?? <public devnet>`
 * and pin it at module load. When the configured endpoint died — the Helius key
 * in the client bundle hit its quota and started answering
 * `{"code":-32429,"message":"max usage reached"}` with HTTP 429 — every chain
 * read failed, `round` stayed null, and the whole site rendered an error box.
 * A single rate-limited key should degrade the app, not take it down.
 *
 * Endpoints are tried in preference order. `advanceEndpoint()` retires the
 * current one process-wide, so one hook discovering the failure moves every
 * later connection in the app onto the survivor.
 */

const PUBLIC_DEVNET = "https://api.devnet.solana.com";

const ENDPOINTS: string[] = Array.from(
  new Set([process.env.NEXT_PUBLIC_RPC_URL, PUBLIC_DEVNET].filter((u): u is string => !!u)),
);

let active = 0;

/**
 * Current endpoint. Call this at connection-creation time rather than caching
 * it in a module constant, otherwise a failover never reaches the caller.
 */
export function rpcEndpoint(): string {
  return ENDPOINTS[active];
}

/** Websocket form of the current endpoint, for subscription-based hooks. */
export function rpcWsEndpoint(): string {
  return rpcEndpoint().replace("https://", "wss://").replace("http://", "ws://");
}

export function getConnection(): Connection {
  return new Connection(rpcEndpoint(), {
    commitment: "confirmed",
    // web3.js retries a 429 four times with backoff before throwing, which on
    // an exhausted key costs ~8.7s before failover can even start. Measured
    // against the live dead endpoint, turning it off drops that to ~0.4s.
    // Retrying an endpoint that is out of quota does not help; moving to the
    // next one does.
    disableRetryOnRateLimit: true,
  });
}

/**
 * True when the endpoint itself is the problem (quota, auth, outage, network)
 * rather than the query. Anything else — a missing account, a decode error —
 * would fail identically on the next endpoint, so it must not trigger failover.
 */
export function isEndpointFailure(err: unknown): boolean {
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
  return [
    "max usage reached",
    "429", "too many requests", "rate limit",
    "401", "403", "unauthorized", "forbidden",
    "502", "503", "504", "service unavailable", "bad gateway",
    "failed to fetch", "networkerror", "network error", "load failed",
  ].some(s => msg.includes(s));
}

/**
 * Retire the current endpoint and move to the next. Returns false when this was
 * already the last one, so callers can surface the original error instead of
 * looping.
 */
export function advanceEndpoint(): boolean {
  if (active >= ENDPOINTS.length - 1) return false;
  active += 1;
  console.warn(`[rpc] endpoint failed, falling back to ${rpcEndpoint()}`);
  return true;
}

/**
 * Run `fn` against the current endpoint, failing over and retrying while the
 * endpoint is at fault and another remains.
 */
export async function withRpcFallback<T>(fn: (conn: Connection) => Promise<T>): Promise<T> {
  for (;;) {
    try {
      return await fn(getConnection());
    } catch (err) {
      if (isEndpointFailure(err) && advanceEndpoint()) continue;
      throw err;
    }
  }
}
