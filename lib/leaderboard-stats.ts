import type {
  LeaderboardFilters,
  LeaderboardHighlight,
  LeaderboardHighlightScope,
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

export const LEADERBOARD_SEASON_DAYS = 30;
const MIN_GAMES_FOR_IMPROVED = 2;

interface SeasonForm {
  games: number;
  firstElo: number;
  peakKills: number | null;
  peakBonus: number | null;
}

function pickHighlightPlayer(
  players: LeaderboardPlayer[],
  read: (player: LeaderboardPlayer) => number | null,
  prefer: "max" | "min",
): LeaderboardPlayer | null {
  let best: LeaderboardPlayer | null = null;
  let bestScore: number | null = null;

  for (const player of players) {
    const score = read(player);
    if (score == null || !Number.isFinite(score)) continue;

    if (
      best == null ||
      bestScore == null ||
      (prefer === "max" ? score > bestScore : score < bestScore) ||
      (score === bestScore && player.elo > best.elo)
    ) {
      best = player;
      bestScore = score;
    }
  }

  return best;
}

function pacificCalendarDay(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function pickDailyRotation<T>(items: readonly T[], dayKey: string): T {
  let hash = 0;
  for (let index = 0; index < dayKey.length; index += 1) {
    hash = (hash * 31 + dayKey.charCodeAt(index)) >>> 0;
  }
  return items[hash % items.length] as T;
}

function recentMatches(
  matches: LeaderboardMatch[],
  now: Date,
  days: number,
): LeaderboardMatch[] {
  const cutoff = now.getTime() - days * 24 * 60 * 60 * 1000;
  return matches.filter((match) => {
    const finishedAt = Date.parse(match.finishedAt);
    return Number.isFinite(finishedAt) && finishedAt >= cutoff;
  });
}

function seasonFormByPlayer(
  matches: LeaderboardMatch[],
): Map<string, SeasonForm> {
  const form = new Map<string, SeasonForm>();
  const ordered = [...matches].sort(
    (first, second) =>
      Date.parse(first.finishedAt) - Date.parse(second.finishedAt),
  );

  for (const match of ordered) {
    for (const seat of match.players) {
      const current = form.get(seat.id);
      if (!current) {
        form.set(seat.id, {
          games: 1,
          firstElo: seat.eloBefore,
          peakKills: seat.stats?.kills ?? null,
          peakBonus: seat.stats?.scoreboardBonus ?? null,
        });
        continue;
      }

      current.games += 1;
      if (seat.stats) {
        if (current.peakKills == null || seat.stats.kills > current.peakKills) {
          current.peakKills = seat.stats.kills;
        }
        if (
          current.peakBonus == null ||
          seat.stats.scoreboardBonus > current.peakBonus
        ) {
          current.peakBonus = seat.stats.scoreboardBonus;
        }
      }
    }
  }

  return form;
}

function getSeasonHighlights(
  players: LeaderboardPlayer[],
  matches: LeaderboardMatch[],
  now: Date,
): LeaderboardHighlight[] {
  const windowMatches = recentMatches(matches, now, LEADERBOARD_SEASON_DAYS);
  const form = seasonFormByPlayer(windowMatches);
  const listed = players.filter((player) => form.has(player.id));
  const highlights: LeaderboardHighlight[] = [];

  const mostImproved = pickHighlightPlayer(
    listed,
    (player) => {
      const season = form.get(player.id);
      if (!season || season.games < MIN_GAMES_FOR_IMPROVED) return null;
      return player.elo - season.firstElo;
    },
    "max",
  );
  if (mostImproved) {
    const season = form.get(mostImproved.id);
    const delta = season ? mostImproved.elo - season.firstElo : 0;
    if (season && delta > 0) {
      highlights.push({
        id: "most_improved",
        label: "Most improved",
        value: formatEloChange(delta),
        detail: `${formatElo(season.firstElo)} → ${formatElo(mostImproved.elo)}`,
        player: mostImproved,
      });
    }
  }

  const mostGames = pickHighlightPlayer(
    listed,
    (player) => form.get(player.id)?.games ?? null,
    "max",
  );
  if (mostGames) {
    const games = form.get(mostGames.id)?.games ?? 0;
    if (games > 0) {
      highlights.push({
        id: "most_games",
        label: "Most games played",
        value: `${games.toLocaleString("en-US")} ${
          games === 1 ? "game" : "games"
        }`,
        player: mostGames,
      });
    }
  }

  const rotating: LeaderboardHighlight[] = [];

  const mostKills = pickHighlightPlayer(
    listed,
    (player) => form.get(player.id)?.peakKills ?? null,
    "max",
  );
  if (mostKills) {
    const kills = form.get(mostKills.id)?.peakKills;
    if (kills != null) {
      rotating.push({
        id: "peak_kills",
        label: "Most kills in a game",
        value: `${kills.toLocaleString("en-US")} kills`,
        player: mostKills,
      });
    }
  }

  const mostBonus = pickHighlightPlayer(
    listed,
    (player) => form.get(player.id)?.peakBonus ?? null,
    "max",
  );
  if (mostBonus) {
    const bonus = form.get(mostBonus.id)?.peakBonus;
    if (bonus != null) {
      rotating.push({
        id: "peak_bonus",
        label: "Highest bonus in a game",
        value: formatBonus(bonus),
        player: mostBonus,
      });
    }
  }

  if (rotating.length === 1) {
    highlights.push(rotating[0]);
  } else if (rotating.length > 1) {
    highlights.push(pickDailyRotation(rotating, pacificCalendarDay(now)));
  }

  return highlights;
}

function getCareerHighlights(
  players: LeaderboardPlayer[],
): LeaderboardHighlight[] {
  const listed = players.filter((player) => player.matches >= 1);
  const highlights: LeaderboardHighlight[] = [];

  // Slot order mirrors season: [headline] [most games] [peak bonus/combat].
  const mostKills = pickHighlightPlayer(
    listed,
    (player) => player.peakKills,
    "max",
  );
  if (mostKills?.peakKills != null) {
    highlights.push({
      id: "peak_kills",
      label: "Most kills in a game",
      value: `${mostKills.peakKills.toLocaleString("en-US")} kills`,
      player: mostKills,
    });
  }

  const mostGames = pickHighlightPlayer(
    listed,
    (player) => player.matches,
    "max",
  );
  if (mostGames != null && mostGames.matches > 0) {
    highlights.push({
      id: "most_games",
      label: "Most games played",
      value: `${mostGames.matches.toLocaleString("en-US")} ${
        mostGames.matches === 1 ? "game" : "games"
      }`,
      player: mostGames,
    });
  }

  const mostBonus = pickHighlightPlayer(
    listed,
    (player) => player.peakBonus,
    "max",
  );
  if (mostBonus?.peakBonus != null) {
    highlights.push({
      id: "peak_bonus",
      label: "Highest bonus in a game",
      value: formatBonus(mostBonus.peakBonus),
      player: mostBonus,
    });
  }

  return highlights;
}

/** Highlights above the standings for season (default) or career scope. */
export function getLeaderboardHighlights(
  players: LeaderboardPlayer[],
  matches: LeaderboardMatch[],
  scope: LeaderboardHighlightScope = "season",
  now = new Date(),
): LeaderboardHighlight[] {
  if (scope === "career") {
    return getCareerHighlights(players);
  }
  return getSeasonHighlights(players, matches, now);
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
