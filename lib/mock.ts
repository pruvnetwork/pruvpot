// Mock data layer — mirrors exact SDK types and on-chain state structure.
// Swap these with real LotteryClient calls after devnet deploy.

import type {
  AttestationStatus,
  NodeInfo,
  LotteryRoundState,
  DrawVoteInfo,
  RoundHistory,
} from "./types";

// ── Attestation ──────────────────────────────────────────────────────────────

export const MOCK_ATTESTATION: AttestationStatus = {
  programId: "FLot1111111111111111111111111111111111111111",
  isAttested: true,
  programHash: "a3f8c2d14e9b7051f6a2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4",
  attestedAt: Math.floor(Date.now() / 1000) - 3600,
  expiresAt: Math.floor(Date.now() / 1000) + 82800,
  nodeCount: 3,
  trustScore: 97,
};

// ── Nodes ────────────────────────────────────────────────────────────────────

export const MOCK_NODES: NodeInfo[] = [
  {
    operatorPubkey: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
    stakeAmount: 1500_000_000_000n,
    reputation: 98,
    totalAttestations: 1243,
    isActive: true,
  },
  {
    operatorPubkey: "DRpbCBMxVnDK7mVeX1YAhHGGHZiBpDcQhFMRtVpTSrh5",
    stakeAmount: 2000_000_000_000n,
    reputation: 95,
    totalAttestations: 987,
    isActive: true,
  },
  {
    operatorPubkey: "HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH",
    stakeAmount: 1200_000_000_000n,
    reputation: 91,
    totalAttestations: 762,
    isActive: true,
  },
];

// ── Active Round ─────────────────────────────────────────────────────────────

let _ticketCount = 47n;
let _prizePool = 47n * 10_000_000n;
let _voteCount = 0;
let _status: 0 | 1 | 2 = 0;
let _winner: string | null = null;

const ROUND_DURATION_MS = 5 * 60 * 1000; // 5 min demo round
const _roundStart = Date.now();

export function getMockRound(): LotteryRoundState {
  const elapsed = Date.now() - _roundStart;
  const ended = elapsed >= ROUND_DURATION_MS;

  if (ended && _status === 0) {
    _status = 1;
    _voteCount = 0;
  }

  return {
    roundId: 42n,
    startSlot: 280_000_000n,
    endSlot: 280_009_000n,
    ticketCount: _ticketCount,
    prizePoolLamports: _prizePool,
    status: _status,
    winner: _winner,
    voteCount: _voteCount,
    activeNodeCount: 3,
    thresholdBps: 6667n,
  };
}

export function addTicket(): void {
  _ticketCount += 1n;
  _prizePool += 10_000_000n; // 0.01 SOL per ticket
}

export function addVote(): { done: boolean; winner: string | null } {
  if (_status !== 1) return { done: false, winner: null };
  _voteCount += 1;
  if (_voteCount >= 2) {
    _status = 2;
    _winner = "9ZwL...kFpQ";
  }
  return { done: _status === 2, winner: _winner };
}

export function getRoundCountdown(): number {
  const elapsed = Date.now() - _roundStart;
  return Math.max(0, ROUND_DURATION_MS - elapsed);
}

// ── Draw Votes ───────────────────────────────────────────────────────────────

export function getMockVotes(): DrawVoteInfo[] {
  const votes: DrawVoteInfo[] = [];
  for (let i = 0; i < _voteCount; i++) {
    votes.push({
      nodePubkey: MOCK_NODES[i].operatorPubkey,
      winnerIndex: 12n,
      votedAt: Date.now() - (2 - i) * 4000,
    });
  }
  return votes;
}

// ── History ──────────────────────────────────────────────────────────────────

export const MOCK_HISTORY: RoundHistory[] = [
  {
    roundId: 41n,
    winner: "3Fj9...mR2K",
    prizePoolLamports: 320_000_000n,
    ticketCount: 32n,
    closedAt: Date.now() / 1000 - 3600,
    txSig: "5xK7...pQ9L",
  },
  {
    roundId: 40n,
    winner: "8Hk2...vN4T",
    prizePoolLamports: 580_000_000n,
    ticketCount: 58n,
    closedAt: Date.now() / 1000 - 7200,
    txSig: "2mR8...wL3J",
  },
  {
    roundId: 39n,
    winner: "6Pn1...qA7S",
    prizePoolLamports: 940_000_000n,
    ticketCount: 94n,
    closedAt: Date.now() / 1000 - 10800,
    txSig: "9jT4...xB6Y",
  },
  {
    roundId: 38n,
    winner: "1Qs5...dC8W",
    prizePoolLamports: 210_000_000n,
    ticketCount: 21n,
    closedAt: Date.now() / 1000 - 14400,
    txSig: "4nZ3...eF5V",
  },
];
