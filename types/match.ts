import type { RankedTeamId } from "./leaderboard";
import type { RankedPlayerScoreboard } from "./ranked-scoreboard";

/** One ranked game, alone or inside a best-of-three series. */
export type MatchFormat = "single" | "bo3";

export interface MatchScoreboardPlayer {
  id: string;
  name: string;
  team: RankedTeamId;
  /**
   * Elo the player entered this match with.
   * Rank icons use this so the scoreboard shows the tier from that game,
   * not their current leaderboard tier.
   */
  elo: number | null;
  /** Elo change from this match, rounded for display. */
  eloChange: number | null;
  /** False when the export has Elo but no end-game scoreboard. */
  performanceUsed: boolean;
  scoreboard: RankedPlayerScoreboard | null;
}

export interface RankedMatchGame {
  id: string;
  /** 1-based index within a series. Singles are always 1. */
  gameNumber: number;
  /** Monotonic match number from the ranked export, when present. */
  rankedNumber: number;
  finishedAt: string;
  mapId: string;
  mapName: string;
  mapImage: string | null;
  mode: string;
  winningTeam: RankedTeamId;
  /** Rounds won by team 0 (RNA) and team 1 (Lineage). */
  score: [number, number];
  players: MatchScoreboardPlayer[];
}

/**
 * Browse unit for /matches.
 * The current export has no series id, so each game is a `single` series.
 * Matches that share `seriesId` (or an explicit bo3 format) group here.
 */
export interface RankedMatchSeries {
  id: string;
  format: MatchFormat;
  playedAt: string;
  games: RankedMatchGame[];
  /** Games won by team 0 and team 1. A single is 1-0 or 0-1. */
  seriesScore: [number, number];
  winner: RankedTeamId | null;
}

export interface RankedMatchesPayload {
  schema: string;
  updatedAt: string;
  series: RankedMatchSeries[];
}

export interface MatchFilters {
  /** Case-insensitive player name search. */
  query: string;
  /** Map id or "all". */
  mapId: string;
  /** Series or match winner, or "all". */
  winner: RankedTeamId | "all";
  /** Inclusive yyyy-mm-dd in Pacific time, or empty. */
  dateFrom: string;
  dateTo: string;
}

export type SortDirection = "asc" | "desc";

export interface ScoreboardSort {
  /** "player" sorts by name; otherwise a scoreboard column id. */
  key: string;
  direction: SortDirection;
}

export interface MatchMapOption {
  id: string;
  name: string;
  image: string | null;
}
