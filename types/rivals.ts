import type { LeaderboardRankTier, RankedPlayerTotals, RankedTeamId } from "@/types/leaderboard";

export type EncounterResult = "win" | "loss" | "unresolved";

export type RivalBadge = "main" | "nemesis" | "emerging" | "established";

export type RivalStoryType =
  | "first_encounter"
  | "series_tied"
  | "lead_taken"
  | "streak_broken"
  | "streak_milestone"
  | "comeback_lead"
  | "established";

export interface RivalSourceSeat {
  id: string;
  team: RankedTeamId;
  stats: RankedPlayerTotals | null;
  name?: string;
}

export interface RivalSourceMatch {
  id: string;
  finishedAt: string;
  map: string;
  mode: string;
  number: number;
  score: [number, number];
  /** Null when the export did not name a winning side with a higher score. */
  winningTeam: RankedTeamId | null;
  players: RivalSourceSeat[];
}

export interface RivalSourcePlayer {
  id: string;
  name: string;
  tier?: LeaderboardRankTier;
}

export interface RivalSource {
  updatedAt: string;
  players: RivalSourcePlayer[];
  matches: RivalSourceMatch[];
}

export interface RivalSeat {
  id: string;
  team: RankedTeamId;
  stats: RankedPlayerTotals | null;
}

export interface RivalEncounter {
  matchId: string;
  finishedAt: string;
  finishedAtMs: number;
  map: string;
  mode: string;
  number: number;
  score: [number, number];
  decisive: boolean;
  winningTeam: RankedTeamId | null;
  seats: [RivalSeat, RivalSeat];
}

export interface RivalSeries {
  pairKey: string;
  /** Lexicographically sorted player ids. */
  playerIds: [string, string];
  encounters: RivalEncounter[];
}

export interface RivalPlayerRef {
  id: string;
  name: string;
  tier?: LeaderboardRankTier;
}

export interface RivalIndex {
  asOfMs: number;
  updatedAt: string;
  players: Map<string, RivalPlayerRef>;
  seriesByKey: Map<string, RivalSeries>;
  pairKeysByPlayer: Map<string, string[]>;
  matches: RivalSourceMatch[];
}

export interface SeriesRecord {
  meetings: number;
  wins: number;
  losses: number;
  unresolved: number;
  decisive: number;
  close: number;
  newestMs: number;
  lastFinishedAt: string | null;
  /** Oldest to newest, at most five. */
  lastFive: EncounterResult[];
}

export interface SeriesStreak {
  kind: "win" | "loss" | "none";
  length: number;
}

export interface OpponentSummary {
  opponentId: string;
  pairKey: string;
  recent: SeriesRecord;
  lifetime: SeriesRecord;
  streak: SeriesStreak;
  scoreMicros: number;
  /** Wins divided by decisive meetings in the recent window. Null when none are decisive. */
  recentWinRate: number | null;
  nemesis: boolean;
  emerging: boolean;
  established: boolean;
  quietLately: boolean;
}

export interface FeaturedRival {
  opponentId: string;
  pairKey: string;
  badges: Array<"main" | "nemesis" | "emerging">;
  explanation: string;
  mutualMain: boolean;
  recent: SeriesRecord;
  lifetime: SeriesRecord;
  streak: SeriesStreak;
}

export interface FeaturedSet {
  developing: boolean;
  main: FeaturedRival | null;
  nemesis: FeaturedRival | null;
  nemesisNote: string | null;
  emerging: FeaturedRival | null;
  emergingNote: string | null;
}

export interface RivalStoryEvent {
  id: string;
  type: RivalStoryType;
  matchId: string;
  finishedAt: string;
  winsLow: number;
  winsHigh: number;
  winsLowBefore: number;
  winsHighBefore: number;
  brokenStreak?: number;
  milestone?: 3 | 5;
  side?: "low" | "high";
  /** Score to cite when a player who had trailed takes the lead. */
  trailWinsLow?: number;
  trailWinsHigh?: number;
}

export interface MapSeriesRecord {
  map: string;
  meetings: number;
  wins: number;
  losses: number;
  unresolved: number;
}

export interface PerformanceRates {
  /** Encounters or matches that included a stat line. */
  sample: number;
  /** Meetings considered, including those without stats. */
  meetings: number;
  rounds: number;
  killsPerRound: number | null;
  resurrectsPerRound: number | null;
  kd: number | null;
  accuracy: number | null;
}

export interface RivalPerformance {
  versus: PerformanceRates;
  other: PerformanceRates;
}

export type RivalUpdateKind =
  | "highlight"
  | "encounter"
  | "corrected"
  | "event"
  | "main_rival";

export interface RivalUpdate {
  id: string;
  kind: RivalUpdateKind;
  text: string;
  pairKey?: string;
  finishedAt?: string;
}

export interface SeenSnapshot {
  snapshotUpdatedAt: string;
  /** match id to a fingerprint of the recorded outcome. */
  matches: Record<string, string>;
  eventIds: string[];
  mainRivalId: string | null;
}

export interface RivalsPreference {
  version: 1;
  selectedPlayerId: string | null;
  pinnedPairKeys: string[];
  lastSeenByPlayer: Record<string, SeenSnapshot>;
}
