// Shared mock data for all pages

export interface TicketEntry {
  roundId: number;
  ticketIndex: number;
  status: "active" | "won" | "lost";
  prizeSOL?: number;
  txSig: string;
  boughtAt: number;
}

export interface RoundStat {
  roundId: number;
  ticketCount: number;
  prizePoolSOL: number;
  winner: string;
  closedAt: number;
}

export interface LeaderEntry {
  rank: number;
  wallet: string;
  totalTickets: number;
  totalSpentSOL: number;
  totalWonSOL: number;
  wins: number;
}

// My Tickets mock
export const MY_TICKETS: TicketEntry[] = [
  { roundId: 42, ticketIndex: 12, status: "active", txSig: "3xK9...pQ2L", boughtAt: Date.now() - 120000 },
  { roundId: 42, ticketIndex: 31, status: "active", txSig: "7mR4...wL8J", boughtAt: Date.now() - 90000 },
  { roundId: 41, ticketIndex: 7,  status: "lost",   txSig: "2nZ6...eF3V", boughtAt: Date.now() - 3720000 },
  { roundId: 40, ticketIndex: 22, status: "won", prizeSOL: 0.464, txSig: "9jT1...xB4Y", boughtAt: Date.now() - 7320000 },
  { roundId: 39, ticketIndex: 55, status: "lost",   txSig: "4Qs7...dC6W", boughtAt: Date.now() - 10920000 },
  { roundId: 38, ticketIndex: 3,  status: "lost",   txSig: "8Hk5...vN2T", boughtAt: Date.now() - 14520000 },
];

// Stats mock — 30 rounds of history
export const ROUND_STATS: RoundStat[] = Array.from({ length: 30 }, (_, i) => {
  const tickets = 20 + Math.floor(Math.sin(i * 0.7) * 15 + Math.random() * 40);
  return {
    roundId: 42 - i,
    ticketCount: tickets,
    prizePoolSOL: parseFloat((tickets * 0.01).toFixed(3)),
    winner: `${Math.random().toString(36).slice(2, 6)}...${Math.random().toString(36).slice(2, 6)}`,
    closedAt: Date.now() / 1000 - i * 86400,
  };
}).reverse();

export const TOTAL_STATS = {
  totalRounds: 42,
  totalPrizeSOL: ROUND_STATS.reduce((a, r) => a + r.prizePoolSOL, 0),
  totalTickets: ROUND_STATS.reduce((a, r) => a + r.ticketCount, 0),
  avgPoolSOL: 0,
  biggestWinSOL: 0,
};
TOTAL_STATS.avgPoolSOL = parseFloat((TOTAL_STATS.totalPrizeSOL / ROUND_STATS.length).toFixed(3));
TOTAL_STATS.biggestWinSOL = parseFloat((Math.max(...ROUND_STATS.map(r => r.prizePoolSOL)) * 0.8).toFixed(3));

// Round detail mock
export interface RoundTicket {
  index: number;
  wallet: string;
  boughtAt: number;
  txSig: string;
  isWinner: boolean;
}

export interface RoundDetail {
  roundId: number;
  ticketCount: number;
  prizePoolSOL: number;
  winner: string;
  winnerPrizeSOL: number;
  closedAt: number;
  slotHash: string;
  finalSlot: number;
  winnerIndex: number;
  txSig: string;
  nodeVotes: { node: string; votedAt: number; sig: string }[];
  tickets: RoundTicket[];
}

const WALLETS = [
  "9ZwL...kFpQ","4mNb...rK9Q","7xKX...gAsU","DRpb...Srh5","8Hk2...vN4T",
  "3Fj9...mR2K","HN7c...YWrH","6Pn1...qA7S","2Qs5...dC8W","1Lm3...nT6R",
  "5Xn8...pQ3T","9jT1...xB4Y","2nZ6...eF3V","4Qs7...dC6W","7mR4...wL8J",
];

function makeRoundDetail(roundId: number): RoundDetail {
  const seed = roundId * 13;
  const count = 20 + ((seed * 7) % 60);
  const prizePoolSOL = parseFloat((count * 0.01).toFixed(3));
  const winnerIdx = (seed * 11) % count;
  const winner = WALLETS[winnerIdx % WALLETS.length];
  const closedAt = Date.now() / 1000 - (42 - roundId) * 86400;
  const slotHash = Array.from({ length: 32 }, (_, i) =>
    ((seed + i * 7) % 256).toString(16).padStart(2, "0")
  ).join("");

  const tickets: RoundTicket[] = Array.from({ length: count }, (_, i) => ({
    index: i,
    wallet: WALLETS[i % WALLETS.length],
    boughtAt: (closedAt - 86000 + i * (86000 / count)) * 1000,
    txSig: `${Math.random().toString(36).slice(2, 6)}...${Math.random().toString(36).slice(2, 6)}`,
    isWinner: i === winnerIdx,
  }));

  return {
    roundId,
    ticketCount: count,
    prizePoolSOL,
    winner,
    winnerPrizeSOL: parseFloat((prizePoolSOL * 0.8).toFixed(3)),
    closedAt,
    slotHash,
    finalSlot: 280_000_000 + roundId * 9000,
    winnerIndex: winnerIdx,
    txSig: `fin${roundId}...${Math.random().toString(36).slice(2, 6)}`,
    nodeVotes: [
      { node: "7xKX...gAsU", votedAt: (closedAt - 30) * 1000, sig: "vt1x...aA3B" },
      { node: "DRpb...Srh5", votedAt: (closedAt - 22) * 1000, sig: "vt2y...bB4C" },
      { node: "HN7c...YWrH", votedAt: (closedAt - 14) * 1000, sig: "vt3z...cC5D" },
    ],
    tickets,
  };
}

export function getRoundDetail(id: number): RoundDetail | null {
  if (id < 13 || id > 41) return null;
  return makeRoundDetail(id);
}

// Profile mock
export interface ProfileRound {
  roundId: number;
  tickets: number;
  prizePoolSOL: number;
  result: "won" | "lost" | "active";
  prizeWonSOL?: number;
  closedAt: number;
}

export interface UserProfile {
  wallet: string;
  totalTickets: number;
  totalSpentSOL: number;
  totalWonSOL: number;
  wins: number;
  winRate: number;
  winStreak: number;
  bestWinStreak: number;
  firstSeenRound: number;
  rounds: ProfileRound[];
  rank: number;
}

export function getProfile(wallet: string): UserProfile | null {
  const entry = LEADERBOARD.find(e => e.wallet === wallet);
  if (!entry) return null;

  const seed = wallet.charCodeAt(0) + wallet.charCodeAt(1);
  const rounds: ProfileRound[] = Array.from({ length: Math.min(entry.totalTickets, 15) }, (_, i) => {
    const roundId = 41 - i;
    const tickets = 1 + ((seed + i * 3) % 3);
    const prizePoolSOL = 0.2 + Math.sin(i * 0.8) * 0.15 + 0.1;
    const didWin = entry.wins > 0 && i < entry.wins;
    return {
      roundId,
      tickets,
      prizePoolSOL: parseFloat(prizePoolSOL.toFixed(3)),
      result: roundId === 42 ? "active" : didWin ? "won" : "lost",
      prizeWonSOL: didWin ? parseFloat((prizePoolSOL * 0.8).toFixed(3)) : undefined,
      closedAt: Date.now() / 1000 - i * 86400,
    };
  });

  const winStreak = rounds.findIndex(r => r.result !== "won");
  const bestWinStreak = Math.max(entry.wins, winStreak);

  return {
    wallet: entry.wallet,
    totalTickets: entry.totalTickets,
    totalSpentSOL: entry.totalSpentSOL,
    totalWonSOL: entry.totalWonSOL,
    wins: entry.wins,
    winRate: parseFloat(((entry.wins / Math.max(rounds.length, 1)) * 100).toFixed(1)),
    winStreak: winStreak > 0 ? winStreak : 0,
    bestWinStreak,
    firstSeenRound: 42 - rounds.length + 1,
    rounds,
    rank: entry.rank,
  };
}

// Leaderboard mock
export const LEADERBOARD: LeaderEntry[] = [
  { rank: 1, wallet: "9ZwL...kFpQ", totalTickets: 187, totalSpentSOL: 1.87, totalWonSOL: 2.32, wins: 4 },
  { rank: 2, wallet: "4mNb...rK9Q", totalTickets: 143, totalSpentSOL: 1.43, totalWonSOL: 0.94, wins: 2 },
  { rank: 3, wallet: "7xKX...gAsU", totalTickets: 121, totalSpentSOL: 1.21, totalWonSOL: 0.00, wins: 0 },
  { rank: 4, wallet: "DRpb...Srh5", totalTickets: 98,  totalSpentSOL: 0.98, totalWonSOL: 0.58, wins: 1 },
  { rank: 5, wallet: "8Hk2...vN4T", totalTickets: 89,  totalSpentSOL: 0.89, totalWonSOL: 0.75, wins: 2 },
  { rank: 6, wallet: "3Fj9...mR2K", totalTickets: 76,  totalSpentSOL: 0.76, totalWonSOL: 0.26, wins: 1 },
  { rank: 7, wallet: "HN7c...YWrH", totalTickets: 65,  totalSpentSOL: 0.65, totalWonSOL: 0.00, wins: 0 },
  { rank: 8, wallet: "6Pn1...qA7S", totalTickets: 54,  totalSpentSOL: 0.54, totalWonSOL: 0.75, wins: 1 },
  { rank: 9, wallet: "2Qs5...dC8W", totalTickets: 43,  totalSpentSOL: 0.43, totalWonSOL: 0.00, wins: 0 },
  { rank: 10,wallet: "1Lm3...nT6R", totalTickets: 38,  totalSpentSOL: 0.38, totalWonSOL: 0.17, wins: 1 },
];
