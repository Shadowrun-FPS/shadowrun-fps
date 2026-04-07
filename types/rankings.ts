import type { TeamResponse } from "@/types/mongodb";

/** Team row used on /tournaments/rankings (matches `/api/teams` JSON). */
export type TeamRankingRow = TeamResponse & {
  calculatedElo: number;
  winRatio: number;
  teamElo?: number;
  tournamentWins?: number;
  teamSize?: number;
};

export type RankingsSortOption =
  | "winRatio"
  | "elo"
  | "wins"
  | "losses"
  | "members"
  | "tournamentWins";

export type RankingsSortDirection = "asc" | "desc";
