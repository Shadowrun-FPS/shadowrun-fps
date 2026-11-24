import type {
  LeaderboardFilters,
  LeaderboardMatch,
  LeaderboardMatchPlayer,
  LeaderboardPlayer,
  LeaderboardRankTier,
  LeaderboardSort,
  LeaderboardSortKey,
  RankedTeamId,
} from "@/types";

export const RANK_TIER_LABELS: Record<LeaderboardRankTier, string> = {
  obsidian: "Obsidian",
  diamond: "Diamond",
  platinum: "Platinum",
  gold: "Gold",
  silver: "Silver",
  bronze: "Bronze",
};

export const RANK_TIER_ORDER: LeaderboardRankTier[] = [
  "obsidian",
  "diamond",
  "platinum",
  "gold",
  "silver",
  "bronze",
];

/** Inclusive Elo floor for each ranked tier. */
export const RANK_TIER_MIN_ELO: Record<LeaderboardRankTier, number> = {
  obsidian: 2300,
  diamond: 1900,
  platinum: 1500,
  gold: 1200,
  silver: 900,
  bronze: 0,
};

export const RANK_TIER_EMBLEM: Record<LeaderboardRankTier, string> = {
  bronze: "/ranked/01_bronze.png",
  silver: "/ranked/02_silver.png",
  gold: "/ranked/03_gold.png",
  platinum: "/ranked/04_platinum.png",
  diamond: "/ranked/05_diamond.png",
  obsidian: "/ranked/06_obsidian.png",
};

export const DEFAULT_LEADERBOARD_FILTERS: LeaderboardFilters = {
  query: "",
  minMatches: 1,
  tier: "all",
};

export const DEFAULT_LEADERBOARD_SORT: LeaderboardSort = {
  key: "rank",
  direction: "asc",
};

export function getRankTier(elo: number): LeaderboardRankTier {
  if (elo >= RANK_TIER_MIN_ELO.obsidian) return "obsidian";
  if (elo >= RANK_TIER_MIN_ELO.diamond) return "diamond";
  if (elo >= RANK_TIER_MIN_ELO.platinum) return "platinum";
  if (elo >= RANK_TIER_MIN_ELO.gold) return "gold";
  if (elo >= RANK_TIER_MIN_ELO.silver) return "silver";
  return "bronze";
}

export const RANKED_TEAM_LABELS: Record<RankedTeamId, string> = {
  0: "RNA",
  1: "Lineage",
};

export function formatElo(elo: number): string {
  return Math.round(elo).toLocaleString("en-US");
}

export function formatEloChange(change: number): string {
  return change > 0 ? `+${Math.round(change)}` : `${Math.round(change)}`;
}

export function formatBonus(amount: number | null | undefined): string {
  if (typeof amount !== "number" || !Number.isFinite(amount)) return "—";
  const rounded = Math.round(amount);
  const absolute = Math.abs(rounded).toLocaleString("en-US");
  return rounded < 0 ? `-$${absolute}` : `$${absolute}`;
}

export function matchPlayerAccuracy(
  player: LeaderboardMatchPlayer,
): number | null {
  const stats = player.stats;
  if (!stats || stats.shotsFired <= 0) return null;
  return stats.shotsHit / stats.shotsFired;
}

export function sortMatchRoster(
  players: LeaderboardMatchPlayer[],
  focusedPlayerId?: string,
): LeaderboardMatchPlayer[] {
  return [...players].sort((first, second) => {
    if (focusedPlayerId) {
      if (first.id === focusedPlayerId) return -1;
      if (second.id === focusedPlayerId) return 1;
    }

    const firstBonus = first.stats?.scoreboardBonus ?? Number.NEGATIVE_INFINITY;
    const secondBonus =
      second.stats?.scoreboardBonus ?? Number.NEGATIVE_INFINITY;
    if (secondBonus !== firstBonus) return secondBonus - firstBonus;

    const firstKills = first.stats?.kills ?? -1;
    const secondKills = second.stats?.kills ?? -1;
    if (secondKills !== firstKills) return secondKills - firstKills;

    return first.name.localeCompare(second.name);
  });
}

export function getOpposingTeam(team: RankedTeamId): RankedTeamId {
  return team === 1 ? 0 : 1;
}

export function getPlayerTeam(
  match: LeaderboardMatch,
  playerId: string,
): RankedTeamId | null {
  const entry = match.players.find((player) => player.id === playerId);
  return entry ? entry.team : null;
}

/** Player's team rounds first, opponent second. A win reads 6–4, not 4–6. */
export function formatPlayerMatchScore(
  match: LeaderboardMatch,
  playerId: string,
): string {
  const team = getPlayerTeam(match, playerId);
  if (team == null) {
    return `${match.score[0]}–${match.score[1]}`;
  }

  const opponent = getOpposingTeam(team);
  return `${match.score[team]}–${match.score[opponent]}`;
}

function isFiniteNumber(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function perStatsMatch(
  total: number,
  statsMatches: number,
): number | null {
  if (statsMatches <= 0) return null;
  return total / statsMatches;
}

export function formatPercent(rate: number | null | undefined): string {
  if (!isFiniteNumber(rate)) return "—";
  return `${Math.round(rate * 100)}%`;
}

export function formatKd(kd: number | null | undefined): string {
  if (!isFiniteNumber(kd)) return "—";
  return kd.toFixed(2);
}

export function formatStatAverage(value: number | null | undefined): string {
  if (!isFiniteNumber(value)) return "—";
  return value.toFixed(1);
}

export function namesMatch(
  playerName: string,
  sessionName: string | null | undefined,
): boolean {
  if (!sessionName) return false;
  return playerName.trim().toLowerCase() === sessionName.trim().toLowerCase();
}

function numericOrLast(value: number | null): number {
  return value === null ? Number.NEGATIVE_INFINITY : value;
}

function comparePlayers(
  first: LeaderboardPlayer,
  second: LeaderboardPlayer,
  key: LeaderboardSortKey,
): number {
  switch (key) {
    case "rank":
      return first.rank - second.rank;
    case "elo":
      return first.elo - second.elo;
    case "wins":
      return first.wins - second.wins;
    case "matches":
      return first.matches - second.matches;
    case "winRate":
      return numericOrLast(first.winRate) - numericOrLast(second.winRate);
    case "kd":
      return numericOrLast(first.kd) - numericOrLast(second.kd);
    default:
      return first.rank - second.rank;
  }
}

export function filterLeaderboardPlayers(
  players: LeaderboardPlayer[],
  filters: LeaderboardFilters,
): LeaderboardPlayer[] {
  const query = filters.query.trim().toLowerCase();

  return players.filter((player) => {
    if (player.matches < filters.minMatches) return false;
    if (filters.tier !== "all" && player.tier !== filters.tier) return false;
    if (query && !player.name.toLowerCase().includes(query)) return false;
    return true;
  });
}

export function sortLeaderboardPlayers(
  players: LeaderboardPlayer[],
  sort: LeaderboardSort,
): LeaderboardPlayer[] {
  const directionFactor = sort.direction === "asc" ? 1 : -1;

  return [...players].sort((first, second) => {
    const primary = comparePlayers(first, second, sort.key);
    if (primary !== 0) return primary * directionFactor;
    return first.rank - second.rank;
  });
}

export function getPodiumPlayers(
  players: LeaderboardPlayer[],
  limit = 3,
): LeaderboardPlayer[] {
  return players
    .filter((player) => player.matches >= 1)
    .sort((first, second) => first.rank - second.rank)
    .slice(0, limit);
}

export function getPlayerMatches(
  matches: LeaderboardMatch[],
  playerId: string,
  limit?: number,
): LeaderboardMatch[] {
  const games = matches
    .filter((match) => match.players.some((player) => player.id === playerId))
    .sort(
      (first, second) =>
        Date.parse(second.finishedAt) - Date.parse(first.finishedAt),
    );

  return limit == null ? games : games.slice(0, limit);
}

export function didPlayerWin(
  match: LeaderboardMatch,
  playerId: string,
): boolean | null {
  const player = match.players.find((entry) => entry.id === playerId);
  if (!player) return null;
  return player.team === match.winningTeam;
}
