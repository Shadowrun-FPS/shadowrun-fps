import type {
  LeaderboardFilters,
  LeaderboardMatch,
  LeaderboardPlayer,
  LeaderboardRankTier,
  LeaderboardSort,
  LeaderboardSortKey,
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

export function formatElo(elo: number): string {
  return Math.round(elo).toLocaleString("en-US");
}

export function formatPercent(rate: number | null): string {
  if (rate === null) return "—";
  return `${Math.round(rate * 100)}%`;
}

export function formatKd(kd: number | null): string {
  if (kd === null) return "—";
  return kd.toFixed(2);
}

export function formatStatAverage(value: number | null): string {
  if (value === null) return "—";
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
