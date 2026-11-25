"use client";

import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";
import { RefreshCw, SlidersHorizontal, X } from "lucide-react";

import { PlayerNameSearch } from "@/components/leaderboard/player-name-search";
import { PlayerSheet } from "@/components/leaderboard/player-sheet";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import { PaginationControls } from "@/components/ui/pagination-controls";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RANKED_TEAM_LABELS } from "@/lib/leaderboard-stats";
import {
  DEFAULT_MATCH_FILTERS,
  filterMatchSeries,
  seriesMatchesFocus,
} from "@/lib/match-browse";
import { formatMatchDateTime } from "@/lib/match-date";
import { cn } from "@/lib/utils";
import type {
  LeaderboardMatch,
  LeaderboardPlayer,
  MatchFilters,
  RankedMatchSeries,
  RankedTeamId,
} from "@/types";

import { SeriesCard } from "./series-card";

const RESULTS_PER_PAGE = 8;

interface MatchesBrowserProps {
  seriesList: RankedMatchSeries[];
  updatedAt: string;
  players: LeaderboardPlayer[];
  /** Profiles kept off the public leaderboard, available for match sheets. */
  unlistedPlayers: LeaderboardPlayer[];
  leaderboardMatches: LeaderboardMatch[];
  onRefresh: () => void;
  isRefreshing: boolean;
}

function resultNoun(seriesList: RankedMatchSeries[], count: number): string {
  const hasSeries = seriesList.some((series) => series.format === "bo3");
  const hasSingles = seriesList.some((series) => series.format === "single");
  if (hasSeries && hasSingles) return count === 1 ? "result" : "results";
  if (hasSeries) return "series";
  return count === 1 ? "match" : "matches";
}

/** Search, filter, and open ranked matches or best-of-three series. */
export function MatchesBrowser({
  seriesList,
  updatedAt,
  players,
  unlistedPlayers,
  leaderboardMatches,
  onRefresh,
  isRefreshing,
}: MatchesBrowserProps) {
  const searchParams = useSearchParams();
  const focusId = searchParams.get("match");
  const [filters, setFilters] = useState<MatchFilters>(DEFAULT_MATCH_FILTERS);
  const deferredFilters = useDeferredValue(filters);
  const isUpdating = deferredFilters !== filters;

  const matches = useMemo(
    () => filterMatchSeries(seriesList, deferredFilters),
    [deferredFilters, seriesList],
  );

  const [requestedPage, setRequestedPage] = useState(1);
  const listTopRef = useRef<HTMLDivElement>(null);
  const pageCount = Math.max(1, Math.ceil(matches.length / RESULTS_PER_PAGE));
  const currentPage = Math.min(requestedPage, pageCount);

  const mapOptions = useMemo(() => {
    const maps = new Map<string, string>();
    for (const series of seriesList) {
      for (const game of series.games) maps.set(game.mapId, game.mapName);
    }
    return [...maps.entries()].sort((first, second) =>
      first[1].localeCompare(second[1]),
    );
  }, [seriesList]);

  useEffect(() => {
    if (!focusId) return;
    const index = matches.findIndex((series) =>
      seriesMatchesFocus(series, focusId),
    );
    if (index >= 0) {
      setRequestedPage(Math.floor(index / RESULTS_PER_PAGE) + 1);
    }
  }, [focusId, matches]);

  const visibleMatches = useMemo(
    () =>
      matches.slice(
        (currentPage - 1) * RESULTS_PER_PAGE,
        currentPage * RESULTS_PER_PAGE,
      ),
    [currentPage, matches],
  );

  const handlePageChange = useCallback((nextPage: number) => {
    setRequestedPage(nextPage);
    listTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const updateFilter = useCallback(
    <Key extends keyof MatchFilters>(key: Key, value: MatchFilters[Key]) => {
      setFilters((current) => ({ ...current, [key]: value }));
      setRequestedPage(1);
    },
    [],
  );

  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const sheetPlayers = useMemo(
    () => [...players, ...unlistedPlayers],
    [players, unlistedPlayers],
  );
  const unlistedPlayerIds = useMemo(
    () => new Set(unlistedPlayers.map((player) => player.id)),
    [unlistedPlayers],
  );
  const playersById = useMemo(() => {
    const byId = new Map<string, LeaderboardPlayer>();
    for (const player of sheetPlayers) byId.set(player.id, player);
    return byId;
  }, [sheetPlayers]);
  const selectablePlayerIds = useMemo(
    () => new Set(playersById.keys()),
    [playersById],
  );
  const selectPlayer = useCallback(
    (playerId: string) => {
      if (playersById.has(playerId)) setSelectedPlayerId(playerId);
    },
    [playersById],
  );
  const selectedPlayer = selectedPlayerId
    ? (playersById.get(selectedPlayerId) ?? null)
    : null;

  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const toggleFilters = useCallback(
    () => setIsFilterPanelOpen((current) => !current),
    [],
  );

  const activeFilterCount = useMemo(
    () =>
      [
        filters.mapId !== DEFAULT_MATCH_FILTERS.mapId,
        filters.winner !== DEFAULT_MATCH_FILTERS.winner,
        filters.dateFrom !== DEFAULT_MATCH_FILTERS.dateFrom,
        filters.dateTo !== DEFAULT_MATCH_FILTERS.dateTo,
      ].filter(Boolean).length,
    [filters],
  );

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_MATCH_FILTERS);
    setRequestedPage(1);
  }, []);

  const hasActiveFilters = useMemo(
    () =>
      (Object.keys(DEFAULT_MATCH_FILTERS) as (keyof MatchFilters)[]).some(
        (key) => filters[key] !== DEFAULT_MATCH_FILTERS[key],
      ),
    [filters],
  );

  const noun = resultNoun(matches, matches.length);
  const rangeStart =
    matches.length === 0 ? 0 : (currentPage - 1) * RESULTS_PER_PAGE + 1;
  const rangeEnd = (currentPage - 1) * RESULTS_PER_PAGE + visibleMatches.length;

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <div className="flex gap-2">
          <PlayerNameSearch
            id="match-search"
            value={filters.query}
            onChange={(query) => updateFilter("query", query)}
            players={sheetPlayers}
            maxLength={64}
          />
          <Button
            type="button"
            variant="outline"
            onClick={onRefresh}
            disabled={isRefreshing}
            aria-label="Refresh matches"
            className="shrink-0 px-3"
          >
            <RefreshCw
              className={cn(isRefreshing && "animate-spin")}
              aria-hidden="true"
            />
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={toggleFilters}
            aria-expanded={isFilterPanelOpen}
            aria-controls="match-filter-panel"
            className="shrink-0 gap-1.5 px-3 md:hidden"
          >
            <SlidersHorizontal aria-hidden="true" />
            Filters
            {activeFilterCount > 0 ? (
              <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-primary px-1 text-xs text-primary-foreground">
                {activeFilterCount}
              </span>
            ) : null}
          </Button>
        </div>

        <div
          id="match-filter-panel"
          className={cn(
            "grid-cols-2 gap-2 rounded-lg border border-border/60 bg-card p-2.5 md:grid-cols-4 md:border-0 md:bg-transparent md:p-0",
            isFilterPanelOpen ? "grid" : "hidden md:grid",
          )}
        >
          <div className="space-y-1">
            <Label htmlFor="match-map" className="text-xs text-muted-foreground">
              Map
            </Label>
            <Select
              value={filters.mapId}
              onValueChange={(value) => updateFilter("mapId", value)}
            >
              <SelectTrigger id="match-map">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All maps</SelectItem>
                {mapOptions.map(([mapId, mapName]) => (
                  <SelectItem key={mapId} value={mapId}>
                    {mapName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label
              htmlFor="match-winner"
              className="text-xs text-muted-foreground"
            >
              Winner
            </Label>
            <Select
              value={filters.winner === "all" ? "all" : String(filters.winner)}
              onValueChange={(value) =>
                updateFilter(
                  "winner",
                  value === "all" ? "all" : (Number(value) as RankedTeamId),
                )
              }
            >
              <SelectTrigger id="match-winner">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Either team</SelectItem>
                <SelectItem value="1">{RANKED_TEAM_LABELS[1]}</SelectItem>
                <SelectItem value="0">{RANKED_TEAM_LABELS[0]}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="match-from" className="text-xs text-muted-foreground">
              From
            </Label>
            <DatePicker
              id="match-from"
              value={filters.dateFrom}
              max={filters.dateTo || undefined}
              onChange={(value) => updateFilter("dateFrom", value)}
              placeholder="Any date"
              aria-label="From date"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="match-to" className="text-xs text-muted-foreground">
              To
            </Label>
            <DatePicker
              id="match-to"
              value={filters.dateTo}
              min={filters.dateFrom || undefined}
              onChange={(value) => updateFilter("dateTo", value)}
              placeholder="Any date"
              aria-label="To date"
            />
          </div>
        </div>
      </div>

      <div
        ref={listTopRef}
        className="flex min-h-[2.25rem] items-center justify-between gap-2 text-sm text-muted-foreground"
      >
        <span aria-live="polite">
          {matches.length > 0
            ? `Showing ${rangeStart}-${rangeEnd} of ${matches.length} ${noun}`
            : `0 ${noun} found`}
        </span>
        <span className="hidden text-xs sm:inline">
          Updated {formatMatchDateTime(updatedAt)}
        </span>
        {hasActiveFilters ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            className="gap-1"
          >
            <X aria-hidden="true" />
            Clear
          </Button>
        ) : null}
      </div>

      {matches.length > 0 ? (
        <div
          className={cn(
            "space-y-3 transition-opacity",
            isUpdating && "opacity-60",
          )}
        >
          {visibleMatches.map((series) => (
            <SeriesCard
              key={series.id}
              series={series}
              defaultExpanded={seriesMatchesFocus(series, focusId)}
              initialGameId={focusId}
              onSelectPlayer={
                sheetPlayers.length > 0 ? selectPlayer : undefined
              }
              selectablePlayerIds={selectablePlayerIds}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border px-4 py-12 text-center text-sm text-muted-foreground">
          {hasActiveFilters
            ? "No ranked matches match those filters."
            : "No ranked matches yet."}
        </div>
      )}

      <PaginationControls
        page={currentPage}
        pageCount={pageCount}
        onPageChange={handlePageChange}
        className="pt-2"
      />

      <PlayerSheet
        player={selectedPlayer}
        players={sheetPlayers}
        matches={leaderboardMatches}
        open={selectedPlayer !== null}
        showRank={
          selectedPlayer != null && !unlistedPlayerIds.has(selectedPlayer.id)
        }
        onOpenChange={(open) => {
          if (!open) setSelectedPlayerId(null);
        }}
      />
    </div>
  );
}
