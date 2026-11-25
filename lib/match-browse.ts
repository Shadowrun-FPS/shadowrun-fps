import type { MatchFilters, RankedMatchSeries } from "@/types";

const MATCH_TIME_ZONE = "America/Los_Angeles";

export const DEFAULT_MATCH_FILTERS: MatchFilters = {
  query: "",
  mapId: "all",
  winner: "all",
  dateFrom: "",
  dateTo: "",
};

/** yyyy-mm-dd in Pacific time, matching the dates shown on match cards. */
export function pacificMatchDate(isoTimestamp: string): string {
  const date = new Date(isoTimestamp);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: MATCH_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function filterMatchSeries(
  seriesList: RankedMatchSeries[],
  filters: MatchFilters = DEFAULT_MATCH_FILTERS,
): RankedMatchSeries[] {
  const normalizedQuery = filters.query.trim().toLowerCase();

  return seriesList.filter((series) => {
    const playedDate = pacificMatchDate(series.playedAt);

    if (filters.winner !== "all" && series.winner !== filters.winner) return false;
    if (filters.dateFrom && playedDate < filters.dateFrom) return false;
    if (filters.dateTo && playedDate > filters.dateTo) return false;
    if (
      filters.mapId !== "all" &&
      !series.games.some((game) => game.mapId === filters.mapId)
    ) {
      return false;
    }
    if (
      normalizedQuery &&
      !series.games.some((game) =>
        game.players.some((player) =>
          player.name.toLowerCase().includes(normalizedQuery),
        ),
      )
    ) {
      return false;
    }
    return true;
  });
}

export function seriesMatchesFocus(
  series: RankedMatchSeries,
  focusId: string | null,
): boolean {
  if (!focusId) return false;
  return series.id === focusId || series.games.some((game) => game.id === focusId);
}
