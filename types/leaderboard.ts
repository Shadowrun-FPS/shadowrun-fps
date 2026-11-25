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
  /** Career scoreboard bonus / stats matches (per match). */
  avgBonus: number | null;
  /**
   * Snapshot match bonus / rounds played with stats.
   * Rounds come from match score totals (first to 6).
   */
  avgBonusPerRound: number | null;
  /**
   * Worst single-match friendly-fire money in the snapshot
   * (most negative seating with combat stats).
   */
  peakFriendlyFire: number | null;
  /**
   * Highest Elo observed in the snapshot (match elo before/after),
   * floored at current Elo.
   */
  peakElo: number | null;
  /** Highest single-match kill count in the snapshot (combat stats only). */
  peakKills: number | null;
  /** Highest single-match scoreboard bonus in the snapshot (combat stats only). */
  peakBonus: number | null;
  totals: RankedPlayerTotals;
  tier: LeaderboardRankTier;
}

export type LeaderboardHighlightScope = "season" | "career";

export type LeaderboardHighlightId =
  | "most_improved"
  | "most_games"
  | "peak_kills"
  | "peak_bonus"
  | "peak_elo"
  | "highest_kd"
  | "avg_bonus"
  | "most_resurrects"
  | "best_win_rate";

/** Highlight card shown above the standings list. */
export interface LeaderboardHighlight {
  id: LeaderboardHighlightId;
  label: string;
  /** Primary stat shown on the right, e.g. "+662" or "26 kills". */
  value: string;
  /** Optional secondary line, e.g. season Elo path "1,500 → 2,162". */
  detail?: string;
  player: LeaderboardPlayer;
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
  /** Public standings only. Excluded players are not listed here. */
  players: LeaderboardPlayer[];
  /**
   * Career profiles kept off the public leaderboard (e.g. intentional exclusions).
   * Used for match scoreboard player sheets and in-match roster tiers.
   */
  unlistedPlayers: LeaderboardPlayer[];
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
