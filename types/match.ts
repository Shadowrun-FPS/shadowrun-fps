export type MatchTeamSide = "lineage" | "rna";

export type MatchFormat = "bo3";

export interface ScoreboardPlayer {
  name: string;
  team: MatchTeamSide;
  bonusTotal: number;
  kills: number;
  deaths: number;
  resurrects: number;
  friendlyFireCost: number;
}

export interface MatchGame {
  gameNumber: 1 | 2 | 3;
  mapId: string;
  mapName: string;
  mapImage: string;
  mode: string;
  winningTeam: MatchTeamSide;
  /** Rounds won by each side, e.g. 6-5. */
  score: Record<MatchTeamSide, number>;
  /** Match clock shown on the in-game scoreboard, e.g. "0:18". */
  clock: string;
  players: ScoreboardPlayer[];
}

export interface MatchSeries {
  id: string;
  playedAt: string;
  format: MatchFormat;
  /** Display names of the two ranked teams (one per side). */
  teamNames: Record<MatchTeamSide, string>;
  games: MatchGame[];
  /** Games won by each side in the series, e.g. 2-1. */
  seriesScore: Record<MatchTeamSide, number>;
  winner: MatchTeamSide;
}

export interface MatchFilters {
  /** Case-insensitive player name search. */
  query: string;
  /** Map id or "all". */
  mapId: string;
  /** Series winner side or "all". */
  winner: MatchTeamSide | "all";
  /** Inclusive ISO date (yyyy-mm-dd) or empty string. */
  dateFrom: string;
  dateTo: string;
}

export interface ScoreboardColumn {
  key: keyof Pick<
    ScoreboardPlayer,
    "bonusTotal" | "kills" | "deaths" | "resurrects" | "friendlyFireCost"
  >;
  label: string;
  /** Compact header used on narrow screens so the table fits without scrolling. */
  shortLabel: string;
  isCurrency?: boolean;
}

export type SortDirection = "asc" | "desc";

export interface ScoreboardSort {
  /** "player" sorts by name; otherwise a stat column key. */
  key: "player" | ScoreboardColumn["key"];
  direction: SortDirection;
}

export interface ScoreboardPage {
  id: string;
  title: string;
  /** Columns for stat tables; undefined means the page is not built yet. */
  columns?: ScoreboardColumn[];
}
