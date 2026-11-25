import type {
  MatchScoreboardPlayer,
  ScoreboardSort,
} from "@/types";
import type { RankedMoneyColumns } from "@/types/ranked-scoreboard";

export type ScoreboardValueKind = "number" | "percent" | "currency";

export interface ScoreboardColumnDef {
  id: string;
  label: string;
  shortLabel: string;
  kind: ScoreboardValueKind;
  /**
   * On player cards, keep the short label even when other columns expand.
   * Useful for long names like "Friendly Fire $" → "FF".
   */
  preferShortOnCard?: boolean;
  read: (player: MatchScoreboardPlayer) => number | null;
}

export interface ScoreboardPageDef {
  id: string;
  title: string;
  columns: ScoreboardColumnDef[];
}

interface RankedPlayerSections {
  stat_summary: "bonus_total" | "deaths" | "friendly_fire_total" | "kills" | "resurrects";
  combat: "body_clear_percent" | "combat_total" | "damage_percent" | "kills";
  accuracy: "hit_percent" | "shots_fired" | "shots_hit";
  artifact: "artifact_total" | "carry_percent" | "pickups" | "scores";
  team_play: "healing_percent" | "res_extra_money" | "resurrects" | "team_play_total";
  friendly_fire: "damage_percent" | "friendly_fire_total" | "penalties";
  round_end: "major_wins" | "minor_wins" | "round_end_total" | "rounds" | "upkeep_money";
}

function finite(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function sectionValue<Section extends keyof RankedPlayerSections>(
  player: MatchScoreboardPlayer,
  section: Section,
  field: RankedPlayerSections[Section],
): number | null {
  const board = player.scoreboard?.[section];
  if (!board) return null;
  const record = board as unknown as Record<string, unknown>;
  return finite(record[field]);
}

function moneyValue(
  player: MatchScoreboardPlayer,
  key: keyof RankedMoneyColumns,
  index: number,
): number | null {
  const column = player.scoreboard?.moneyColumns?.[key];
  if (!column || index >= column.length) return null;
  return finite(column[index]);
}

function fieldColumn<Section extends keyof RankedPlayerSections>(
  id: string,
  label: string,
  shortLabel: string,
  kind: ScoreboardValueKind,
  section: Section,
  field: RankedPlayerSections[Section],
  options?: { preferShortOnCard?: boolean },
): ScoreboardColumnDef {
  return {
    id,
    label,
    shortLabel,
    kind,
    preferShortOnCard: options?.preferShortOnCard,
    read: (player) => sectionValue(player, section, field),
  };
}

interface MoneyLabel {
  label: string;
  shortLabel: string;
  kind: ScoreboardValueKind;
  preferShortOnCard?: boolean;
}

function moneyColumns(
  key: keyof RankedMoneyColumns,
  labels: MoneyLabel[],
  skipIndexes: number[] = [],
): ScoreboardColumnDef[] {
  return labels.flatMap((label, index) => {
    if (skipIndexes.includes(index)) return [];
    return [
      {
        id: `${key}-${index}`,
        label: label.label,
        shortLabel: label.shortLabel,
        kind: label.kind,
        preferShortOnCard: label.preferShortOnCard,
        read: (player: MatchScoreboardPlayer) => moneyValue(player, key, index),
      },
    ];
  });
}

/**
 * Money sub-line names are not in the export. Index 0 is the category total
 * in sampled payloads. Later slots are unlabeled game breakdowns — for
 * friendly_fire, indexes 1 and 2 often sum to the total when both are set.
 * Round-end index 3 is the round count and index 4 is upkeep; combat /
 * artifact / team-play middle slots stay numbered until names are known.
 */
const COMBAT_MONEY: MoneyLabel[] = [
  { label: "Combat $", shortLabel: "$", kind: "currency" },
  { label: "Combat 2", shortLabel: "C2", kind: "currency" },
  { label: "Combat 3", shortLabel: "C3", kind: "currency" },
  { label: "Combat 4", shortLabel: "C4", kind: "currency" },
];

const ARTIFACT_MONEY: MoneyLabel[] = [
  { label: "Artifact $", shortLabel: "$", kind: "currency" },
  { label: "Artifact 2", shortLabel: "A2", kind: "currency" },
  { label: "Artifact 3", shortLabel: "A3", kind: "currency" },
  { label: "Artifact 4", shortLabel: "A4", kind: "currency" },
];

const TEAM_PLAY_MONEY: MoneyLabel[] = [
  { label: "Team $", shortLabel: "$", kind: "currency" },
  { label: "Team 2", shortLabel: "T2", kind: "currency" },
  { label: "Team 3", shortLabel: "T3", kind: "currency" },
  { label: "Team 4", shortLabel: "T4", kind: "currency" },
];

const FRIENDLY_FIRE_MONEY: MoneyLabel[] = [
  {
    label: "Friendly Fire $",
    shortLabel: "FF $",
    kind: "currency",
    preferShortOnCard: true,
  },
  // Unnamed in the export; placeholders until the game labels are confirmed.
  { label: "Fire 2", shortLabel: "F2", kind: "currency" },
  { label: "Fire 3", shortLabel: "F3", kind: "currency" },
];

const ROUND_END_MONEY: MoneyLabel[] = [
  { label: "Round $", shortLabel: "Rnd", kind: "currency" },
  { label: "Major $", shortLabel: "Maj", kind: "currency" },
  { label: "Minor $", shortLabel: "Min", kind: "currency" },
  { label: "Rounds", shortLabel: "Rds", kind: "number" },
  { label: "Upkeep $", shortLabel: "Upk", kind: "currency" },
];

export const SCOREBOARD_PAGES: ScoreboardPageDef[] = [
  {
    id: "stat_summary",
    title: "Stat Summary",
    columns: [
      fieldColumn("bonus_total", "Bonus $", "Bonus", "currency", "stat_summary", "bonus_total"),
      fieldColumn("kills", "Kills", "K", "number", "stat_summary", "kills"),
      fieldColumn("deaths", "Deaths", "D", "number", "stat_summary", "deaths"),
      fieldColumn("resurrects", "Resurrects", "Res", "number", "stat_summary", "resurrects"),
      fieldColumn(
        "friendly_fire_total",
        "Friendly Fire $",
        "FF $",
        "currency",
        "stat_summary",
        "friendly_fire_total",
        { preferShortOnCard: true },
      ),
    ],
  },
  {
    id: "combat",
    title: "Combat",
    columns: [
      fieldColumn("combat_kills", "Kills", "K", "number", "combat", "kills"),
      fieldColumn("damage_percent", "Damage %", "Dmg", "percent", "combat", "damage_percent"),
      fieldColumn(
        "body_clear_percent",
        "Body Clear %",
        "Body",
        "percent",
        "combat",
        "body_clear_percent",
      ),
      ...moneyColumns("combat", COMBAT_MONEY),
    ],
  },
  {
    id: "accuracy",
    title: "Accuracy",
    columns: [
      fieldColumn("hit_percent", "Hit %", "Hit", "percent", "accuracy", "hit_percent"),
      fieldColumn("shots_fired", "Shots Fired", "Fired", "number", "accuracy", "shots_fired"),
      fieldColumn("shots_hit", "Shots Hit", "Hits", "number", "accuracy", "shots_hit"),
    ],
  },
  {
    id: "artifact",
    title: "Artifact",
    columns: [
      fieldColumn("pickups", "Pickups", "Pick", "number", "artifact", "pickups"),
      fieldColumn("scores", "Scores", "Scr", "number", "artifact", "scores"),
      fieldColumn("carry_percent", "Carry %", "Carry", "percent", "artifact", "carry_percent"),
      ...moneyColumns("artifact", ARTIFACT_MONEY),
    ],
  },
  {
    id: "team_play",
    title: "Team Play",
    columns: [
      fieldColumn("team_resurrects", "Resurrects", "Res", "number", "team_play", "resurrects"),
      fieldColumn(
        "healing_percent",
        "Healing %",
        "Heal",
        "percent",
        "team_play",
        "healing_percent",
      ),
      fieldColumn(
        "res_extra_money",
        "Res Extra $",
        "Res $",
        "currency",
        "team_play",
        "res_extra_money",
      ),
      ...moneyColumns("team_play", TEAM_PLAY_MONEY),
    ],
  },
  {
    id: "friendly_fire",
    title: "Friendly Fire",
    columns: [
      fieldColumn("penalties", "Penalties", "Pen", "number", "friendly_fire", "penalties"),
      fieldColumn(
        "ff_damage_percent",
        "Damage %",
        "Dmg",
        "percent",
        "friendly_fire",
        "damage_percent",
      ),
      ...moneyColumns("friendly_fire", FRIENDLY_FIRE_MONEY),
    ],
  },
  {
    id: "round_end",
    title: "Round End",
    columns: [
      fieldColumn("major_wins", "Major Wins", "Maj", "number", "round_end", "major_wins"),
      fieldColumn("minor_wins", "Minor Wins", "Min", "number", "round_end", "minor_wins"),
      ...moneyColumns("round_end", ROUND_END_MONEY),
    ],
  },
];

export function defaultScoreboardSort(page: ScoreboardPageDef): ScoreboardSort {
  const currency = page.columns.find((column) => column.kind === "currency");
  const key = currency?.id ?? page.columns[0]?.id ?? "player";
  return { key, direction: "desc" };
}

export function playerHasScoreboard(player: MatchScoreboardPlayer): boolean {
  return player.scoreboard != null;
}
