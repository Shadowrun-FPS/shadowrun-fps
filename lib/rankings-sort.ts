import type {
  RankingsSortDirection,
  RankingsSortOption,
  TeamRankingRow,
} from "@/types/rankings";

export function calculateWinRatePct(wins: number, losses: number): string {
  const winsNum = Number(wins || 0);
  const lossesNum = Number(losses || 0);
  const totalGames = winsNum + lossesNum;
  if (totalGames === 0) return "0.0%";
  if (winsNum === 1 && lossesNum === 0) return "100.0%";
  const winRate = (winsNum / totalGames) * 100;
  return `${winRate.toFixed(1)}%`;
}

function winRatioValue(team: TeamRankingRow): number {
  const w = Number(team.wins || 0);
  const l = Number(team.losses || 0);
  const t = w + l;
  return t > 0 ? w / t : 0;
}

function eloValue(team: TeamRankingRow): number {
  return Number(team.teamElo || team.calculatedElo || 0);
}

/**
 * When the primary sort column ties, order teams consistently:
 * higher team ELO → higher win rate → more wins → more tournament wins → name (A–Z).
 * This uses the same team ELO shown in the table (aggregate), not average ELO per member.
 */
function tiebreakCompare(a: TeamRankingRow, b: TeamRankingRow): number {
  let d = eloValue(b) - eloValue(a);
  if (d !== 0) return d;
  d = winRatioValue(b) - winRatioValue(a);
  if (d !== 0) return d;
  d = (b.wins || 0) - (a.wins || 0);
  if (d !== 0) return d;
  d = (b.tournamentWins || 0) - (a.tournamentWins || 0);
  if (d !== 0) return d;
  return (a.name || "").localeCompare(b.name || "", undefined, {
    sensitivity: "base",
  });
}

function compareTeams(
  a: TeamRankingRow,
  b: TeamRankingRow,
  sortBy: RankingsSortOption,
): number {
  let primary = 0;
  if (sortBy === "elo") {
    primary = eloValue(b) - eloValue(a);
  } else if (sortBy === "winRatio") {
    primary = winRatioValue(b) - winRatioValue(a);
  } else if (sortBy === "wins") {
    primary = (b.wins || 0) - (a.wins || 0);
  } else if (sortBy === "losses") {
    primary = (b.losses || 0) - (a.losses || 0);
  } else if (sortBy === "members") {
    primary = (b.members?.length || 0) - (a.members?.length || 0);
  } else if (sortBy === "tournamentWins") {
    primary = (b.tournamentWins || 0) - (a.tournamentWins || 0);
  }
  if (primary !== 0) return primary;
  return tiebreakCompare(a, b);
}

/** Filter by team size + search, then sort (single pipeline for list + rank badges). */
export function buildRankingsList(
  teams: TeamRankingRow[],
  options: {
    teamSize: number;
    searchQuery: string;
    sortBy: RankingsSortOption;
    sortDirection: RankingsSortDirection;
  },
): TeamRankingRow[] {
  if (teams.length === 0) return [];

  let filtered = teams.filter((team) => {
    const teamSizeValue = team.teamSize || 4;
    return teamSizeValue === options.teamSize;
  });

  const q = options.searchQuery.trim().toLowerCase();
  if (q) {
    filtered = filtered.filter((team) => {
      return (
        team.name?.toLowerCase().includes(q) ||
        team.tag?.toLowerCase().includes(q) ||
        team.captain?.discordNickname?.toLowerCase().includes(q) ||
        team.captain?.discordUsername?.toLowerCase().includes(q)
      );
    });
  }

  const comparison = (a: TeamRankingRow, b: TeamRankingRow) => {
    const base = compareTeams(a, b, options.sortBy);
    return options.sortDirection === "asc" ? -base : base;
  };

  return [...filtered].sort(comparison);
}

export function getTeamRankInList(
  list: TeamRankingRow[],
  teamId: string,
): number | null {
  const index = list.findIndex((t) => t._id.toString() === teamId);
  return index >= 0 ? index + 1 : null;
}
