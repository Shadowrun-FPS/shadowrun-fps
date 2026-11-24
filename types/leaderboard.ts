export const RANKED_PUBLIC_SCHEMA = "shadowrun.ranked.public.v1";

export interface RankedPlayerTotals {
  artifactPickups: number;
  artifactScores: number;
  deaths: number;
  friendlyFireTotal: number;
  kills: number;
  resurrects: number;
  scoreboardBonus: number;
  shotsFired: number;
  shotsHit: number;
}

export type LeaderboardRankTier =
  | "obsidian"
  | "diamond"
  | "platinum"
  | "gold"
  | "silver"
  | "bronze";

export interface LeaderboardPlayer {
  id: string;
  name: string;
  rank: number;
  elo: number;
  wins: number;
  losses: number;
  matches: number;
  statsMatches: number;
  /** Wins / matches, or null when the player has no games. */
  winRate: number | null;
  /** Kills / deaths, or kills when deaths is 0. Null with no combat stats. */
  kd: number | null;
  /** Hits / shots, or null when no shots were recorded. */
  accuracy: number | null;
  avgKills: number | null;
  avgDeaths: number | null;
  avgResurrects: number | null;
  avgBonus: number | null;
  totals: RankedPlayerTotals;
  tier: LeaderboardRankTier;
}

export type RankedTeamId = 0 | 1;

export interface LeaderboardMatchPlayer {
  id: string;
  name: string;
  team: RankedTeamId;
  eloBefore: number;
  eloAfter: number;
  eloChange: number;
  /** False when the snapshot has Elo but no end-game combat card. */
  performanceUsed: boolean;
  stats: RankedPlayerTotals | null;
}

export interface LeaderboardMatch {
  id: string;
  finishedAt: string;
  map: string;
  mode: string;
  number: number;
  score: [number, number];
  winningTeam: RankedTeamId;
  players: LeaderboardMatchPlayer[];
}

export interface LeaderboardPayload {
  schema: string;
  updatedAt: string;
  players: LeaderboardPlayer[];
  matches: LeaderboardMatch[];
}

export type LeaderboardSortKey =
  | "rank"
  | "elo"
  | "wins"
  | "winRate"
  | "kd"
  | "matches";

export type LeaderboardSortDirection = "asc" | "desc";

export interface LeaderboardSort {
  key: LeaderboardSortKey;
  direction: LeaderboardSortDirection;
}

export interface LeaderboardFilters {
  query: string;
  /** Inclusive minimum career matches. 0 shows placement players. */
  minMatches: number;
  tier: LeaderboardRankTier | "all";
}
