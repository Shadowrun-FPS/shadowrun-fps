export type CompareWindow = "all" | "30d" | "7d";

export type CompareScope = "own" | "shared";

export interface CompareQuery {
  playerIds: string[];
  window: CompareWindow;
  map: string | null;
  mode: string | null;
  scope: CompareScope;
}

export type CompareOutcome = "win" | "loss" | "unresolved";

export interface CompareEvidence {
  matchId: string;
  finishedAt: string;
  map: string;
  mode: string;
  outcome: CompareOutcome;
  scoreLabel: string;
  statsRecorded: boolean;
  /** Kills divided by that match's score total. Null when either number is missing. */
  killsPerRound: number | null;
}

export interface CompareMapRow {
  map: string;
  wins: number;
  losses: number;
  meetings: number;
  killsPerRound: number | null;
}

/** Match-level sample for one selected player. Profile totals are not used. */
export interface PlayerSample {
  playerId: string;
  matches: number;
  wins: number;
  losses: number;
  decisive: number;
  statRows: number;
  damagePercentSum: number;
  damageRows: number;
  kills: number;
  deaths: number;
  killsWithRounds: number;
  killRoundRows: number;
  roundsWithKills: number;
  resurrects: number;
  resurrectsWithRounds: number;
  resRoundRows: number;
  roundsWithResurrects: number;
  bonus: number;
  bonusWithRounds: number;
  bonusRoundRows: number;
  roundsWithBonus: number;
  shotsFired: number;
  shotsHit: number;
  shotRows: number;
  artifactPickups: number;
  artifactScores: number;
  friendlyFire: number;
  maps: CompareMapRow[];
  evidence: CompareEvidence[];
}

export interface ComparisonModel {
  asOfMs: number;
  maps: string[];
  modes: string[];
  /** Matches that contain every selected player, after the other filters. */
  sharedMatchCount: number;
  emptyShared: boolean;
  players: PlayerSample[];
}

export type MetricGroup = "overview" | "combat" | "support" | "details";

export interface MetricCell {
  playerId: string;
  text: string;
  accessibleText: string;
  /** Positive infinity stands for a K/D with kills and no deaths. */
  plot: number | null;
  /** Share of the largest positive value in the row, from 0 to 1. */
  bar: number | null;
  highest: boolean;
  sample: number;
  coverage: string | null;
}

export interface MetricRow {
  id: string;
  group: MetricGroup;
  primary: boolean;
  name: string;
  definition: string;
  higherIsBetter: boolean;
  cells: MetricCell[];
}
