/** In-game scoreboard sections from the ranked public export. */

export interface RankedStatSummary {
  bonus_total: number;
  deaths: number;
  friendly_fire_total: number;
  kills: number;
  resurrects: number;
}

export interface RankedCombatStats {
  body_clear_percent: number;
  combat_total: number;
  damage_percent: number;
  kills: number;
}

export interface RankedAccuracyStats {
  hit_percent: number;
  shots_fired: number;
  shots_hit: number;
}

export interface RankedArtifactStats {
  artifact_total: number;
  carry_percent: number;
  pickups: number;
  scores: number;
}

export interface RankedTeamPlayStats {
  healing_percent: number;
  res_extra_money: number;
  resurrects: number;
  team_play_total: number;
}

export interface RankedFriendlyFireStats {
  damage_percent: number;
  friendly_fire_total: number;
  penalties: number;
}

export interface RankedRoundEndStats {
  major_wins: number;
  minor_wins: number;
  round_end_total: number;
  rounds: number;
  upkeep_money: number;
}

/**
 * Per-category money arrays from the in-game scoreboard.
 * Lengths in the current export: combat 4, artifact 4, team_play 4,
 * friendly_fire 3, round_end 5. Index 0 matches the category total.
 * Later indexes are sub-lines whose names are not in the JSON.
 */
export interface RankedMoneyColumns {
  artifact: number[];
  combat: number[];
  friendly_fire: number[];
  round_end: number[];
  team_play: number[];
}

export interface RankedPlayerScoreboard {
  stat_summary: RankedStatSummary | null;
  combat: RankedCombatStats | null;
  accuracy: RankedAccuracyStats | null;
  artifact: RankedArtifactStats | null;
  team_play: RankedTeamPlayStats | null;
  friendly_fire: RankedFriendlyFireStats | null;
  round_end: RankedRoundEndStats | null;
  moneyColumns: RankedMoneyColumns | null;
}
