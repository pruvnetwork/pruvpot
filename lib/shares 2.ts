/**
 * Prize split helpers. The split is defined on-chain in LotteryConfig
 * (node_share_bps, treasury_share_bps); the winner receives the remainder.
 * Pass the config values when you have them; the defaults mirror the current
 * devnet deployment (10% nodes, 5% treasury, 85% winner).
 */
export const DEFAULT_NODE_BPS = 1000;
export const DEFAULT_TREASURY_BPS = 500;

export interface Split {
  winner: bigint;
  nodes: bigint;
  treasury: bigint;
}

export function splitPrize(pool: bigint, nodeBps = DEFAULT_NODE_BPS, treasuryBps = DEFAULT_TREASURY_BPS): Split {
  const nodes = (pool * BigInt(nodeBps)) / 10_000n;
  const treasury = (pool * BigInt(treasuryBps)) / 10_000n;
  return { winner: pool - nodes - treasury, nodes, treasury };
}

export function winnerShareLamports(pool: bigint, nodeBps?: number, treasuryBps?: number): bigint {
  return splitPrize(pool, nodeBps, treasuryBps).winner;
}

export function winnerPct(nodeBps = DEFAULT_NODE_BPS, treasuryBps = DEFAULT_TREASURY_BPS): number {
  return (10_000 - nodeBps - treasuryBps) / 100;
}
