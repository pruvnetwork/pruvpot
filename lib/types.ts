// Mirror of PRUV SDK types — synced with pruv-solana-main/sdk/src/types.ts

export interface AttestationStatus {
  programId: string;
  isAttested: boolean;
  programHash: string;
  attestedAt: number;
  expiresAt: number;
  nodeCount: number;
  trustScore: number;
}

export interface NodeInfo {
  operatorPubkey: string;
  stakeAmount: bigint;
  reputation: number;
  totalAttestations: number;
  isActive: boolean;
}

export interface LotteryRoundState {
  roundId: bigint;
  startSlot: bigint;
  endSlot: bigint;
  ticketCount: bigint;
  prizePoolLamports: bigint;
  status: 0 | 1 | 2; // 0=Open 1=Committing 2=Closed
  winner: string | null;
  voteCount: number;
  activeNodeCount: number;
  thresholdBps: bigint;
}

export interface DrawVoteInfo {
  nodePubkey: string;
  winnerIndex: bigint;
  votedAt: number;
}

export interface RoundHistory {
  roundId: bigint;
  winner: string;
  prizePoolLamports: bigint;
  ticketCount: bigint;
  closedAt: number;
  txSig: string;
}
