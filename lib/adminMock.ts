// Mock admin state — mirrors on-chain LotteryConfig and operator instructions

export interface LotteryConfig {
  authority: string;
  treasury: string;
  winnerBps: number;
  nodeBps: number;
  treasuryBps: number;
  ticketPriceLamports: bigint;
  roundDurationSlots: bigint;
  nodeCount: number;
  totalRoundsRun: number;
  totalVolumeLamports: bigint;
  isInitialized: boolean;
}

export interface AdminLogEntry {
  id: number;
  action: string;
  detail: string;
  at: number;
  status: "success" | "pending" | "error";
  txSig?: string;
}

export const MOCK_CONFIG: LotteryConfig = {
  authority: "9ZwL...kFpQ",
  treasury: "TRE5...vault",
  winnerBps: 8000,
  nodeBps: 1500,
  treasuryBps: 500,
  ticketPriceLamports: 10_000_000n,
  roundDurationSlots: 216_000n,
  nodeCount: 3,
  totalRoundsRun: 41,
  totalVolumeLamports: 21_500_000_000n,
  isInitialized: true,
};

let _log: AdminLogEntry[] = [
  {
    id: 1, action: "initialize_round", detail: "Round #42 opened · 216,000 slot window",
    at: Date.now() - 14 * 60 * 1000, status: "success", txSig: "ini42...xB4Y",
  },
  {
    id: 2, action: "init_config", detail: "Config deployed · 8000/1500/500 BPS",
    at: Date.now() - 48 * 3600 * 1000, status: "success", txSig: "cfg1...kQ3L",
  },
];
let _logId = 3;

export function getAdminLog(): AdminLogEntry[] {
  return [..._log].reverse();
}

export function addAdminLog(entry: Omit<AdminLogEntry, "id" | "at">): AdminLogEntry {
  const e: AdminLogEntry = { ...entry, id: _logId++, at: Date.now() };
  _log.push(e);
  return e;
}

export const MOCK_TREASURY = {
  balanceLamports: 1_075_000_000n,
  pendingPayoutLamports: 0n,
  allTimeCollectedLamports: 1_075_000_000n,
};

export const MOCK_NODES_ADMIN = [
  { pubkey: "7xKX...gAsU", stake: "1,500 PRUV", rep: 98, uptime: "99.2%", active: true },
  { pubkey: "DRpb...Srh5", stake: "2,000 PRUV", rep: 95, uptime: "97.8%", active: true },
  { pubkey: "HN7c...YWrH", stake: "1,200 PRUV", rep: 91, uptime: "96.1%", active: true },
];

// ── Operator (Node) mock ──────────────────────────────────────────────────────

export interface OperatorNode {
  pubkey: string;
  stakePruv: number;
  reputation: number;
  uptime: string;
  totalAttestations: number;
  active: boolean;
}

export interface EarningsEntry {
  roundId: number;
  prizePoolSOL: number;
  shareSOL: number;
  paidAt: number;
  txSig: string;
}

export interface OperatorLogEntry {
  id: number;
  action: string;
  detail: string;
  at: number;
  status: "success" | "pending" | "error";
  txSig?: string;
}

// Three selectable node identities for demo
export const OPERATOR_NODES: OperatorNode[] = [
  { pubkey: "7xKX...gAsU", stakePruv: 1500, reputation: 98, uptime: "99.2%", totalAttestations: 1243, active: true },
  { pubkey: "DRpb...Srh5", stakePruv: 2000, reputation: 95, uptime: "97.8%", totalAttestations: 987,  active: true },
  { pubkey: "HN7c...YWrH", stakePruv: 1200, reputation: 91, uptime: "96.1%", totalAttestations: 762,  active: true },
];

export const OPERATOR_EARNINGS: EarningsEntry[] = Array.from({ length: 10 }, (_, i) => {
  const roundId = 41 - i;
  const prizePoolSOL = 0.2 + Math.sin(i * 0.9) * 0.15 + Math.random() * 0.3;
  return {
    roundId,
    prizePoolSOL: parseFloat(prizePoolSOL.toFixed(3)),
    shareSOL: parseFloat((prizePoolSOL * 0.15 / 3).toFixed(4)),
    paidAt: Date.now() - i * 86400 * 1000,
    txSig: `pay${roundId}...${Math.random().toString(36).slice(2, 5)}`,
  };
});

let _opLog: OperatorLogEntry[] = [
  {
    id: 1, action: "cast_draw_vote", detail: "Round #41 · winnerIndex=22",
    at: Date.now() - 25 * 3600 * 1000, status: "success", txSig: "vt41...aA3B",
  },
  {
    id: 2, action: "claim_node_prize", detail: "Round #41 · +0.016 SOL",
    at: Date.now() - 24 * 3600 * 1000, status: "success", txSig: "cl41...bB4C",
  },
];
let _opLogId = 3;

export function getOperatorLog(): OperatorLogEntry[] {
  return [..._opLog].reverse();
}

export function addOperatorLog(entry: Omit<OperatorLogEntry, "id" | "at">): OperatorLogEntry {
  const e: OperatorLogEntry = { ...entry, id: _opLogId++, at: Date.now() };
  _opLog.push(e);
  return e;
}
