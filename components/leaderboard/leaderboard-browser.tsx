"use client";

import {
  useCallback,
  useDeferredValue,
  useMemo,
  useRef,
  useState,
} from "react";
import { RefreshCw, X } from "lucide-react";
import { useSession } from "next-auth/react";

import { LeaderboardPodium } from "@/components/leaderboard/leaderboard-podium";
import { LeaderboardRow } from "@/components/leaderboard/leaderboard-row";
import { LeaderboardTable } from "@/components/leaderboard/leaderboard-table";
import { PlayerNameSearch } from "@/components/leaderboard/player-name-search";
import { PlayerSheet } from "@/components/leaderboard/player-sheet";
import { RankTierMark } from "@/components/leaderboard/rank-tier-mark";
import { Button } from "@/components/ui/button";
import { PaginationControls } from "@/components/ui/pagination-controls";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LocalDateTime } from "@/components/local-date-time";
import {
  DEFAULT_LEADERBOARD_FILTERS,
  DEFAULT_LEADERBOARD_SORT,
  RANK_TIER_LABELS,
  RANK_TIER_ORDER,
  filterLeaderboardPlayers,
  getLeaderboardHighlights,
  namesMatch,
  sortLeaderboardPlayers,
} from "@/lib/leaderboard-stats";
import { cn } from "@/lib/utils";
import type {
  LeaderboardFilters,
  LeaderboardHighlightScope,
  LeaderboardPayload,
  LeaderboardRankTier,
  LeaderboardSort,
  LeaderboardSortKey,
} from "@/types";

const PLAYERS_PER_PAGE = 25;

interface LeaderboardBrowserProps {
  data: LeaderboardPayload;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export function LeaderboardBrowser({
  data,
  onRefresh,
  isRefreshing,
}: LeaderboardBrowserProps) {
  const { data: session } = useSession();
  const highlightedName = session?.user?.nickname || session?.user?.name || null;

  const [filters, setFilters] = useState<LeaderboardFilters>(
    DEFAULT_LEADERBOARD_FILTERS,
  );
  const deferredFilters = useDeferredValue(filters);
  const isUpdating = deferredFilters !== filters;
  const [sort, setSort] = useState<LeaderboardSort>(DEFAULT_LEADERBOARD_SORT);
  const [requestedPage, setRequestedPage] = useState(1);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [highlightScope, setHighlightScope] =
    useState<LeaderboardHighlightScope>("season");
  const listTopRef = useRef<HTMLDivElement>(null);

  const highlights = useMemo(
    () =>
      getLeaderboardHighlights(data.players, data.matches, highlightScope),
    [data.players, data.matches, highlightScope],
  );

  const filteredPlayers = useMemo(
    () =>
      sortLeaderboardPlayers(
        filterLeaderboardPlayers(data.players, deferredFilters),
        sort,
      ),
    [data.players, deferredFilters, sort],
  );

  const pageCount = Math.max(
    1,
    Math.ceil(filteredPlayers.length / PLAYERS_PER_PAGE),
  );
  const currentPage = Math.min(requestedPage, pageCount);
  const visiblePlayers = useMemo(
    () =>
      filteredPlayers.slice(
        (currentPage - 1) * PLAYERS_PER_PAGE,
        currentPage * PLAYERS_PER_PAGE,
      ),
    [filteredPlayers, currentPage],
  );

  const selectedPlayer = useMemo(
    () =>
      data.players.find((player) => player.id === selectedPlayerId) ?? null,
    [data.players, selectedPlayerId],
  );

  const hasActiveFilters = useMemo(
    () =>
      filters.query !== DEFAULT_LEADERBOARD_FILTERS.query ||
      filters.tier !== DEFAULT_LEADERBOARD_FILTERS.tier,
    [filters.query, filters.tier],
  );

  const handlePageChange = useCallback((nextPage: number) => {
    setRequestedPage(nextPage);
    listTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const updateFilter = useCallback(
    <Key extends keyof LeaderboardFilters>(
      key: Key,
      value: LeaderboardFilters[Key],
    ) => {
      setFilters((current) => ({ ...current, [key]: value }));
      setRequestedPage(1);
    },
    [],
  );

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_LEADERBOARD_FILTERS);
    setSort(DEFAULT_LEADERBOARD_SORT);
    setRequestedPage(1);
  }, []);

  const handleSort = useCallback((key: LeaderboardSortKey) => {
    setSort((current) => {
      if (current.key === key) {
        return {
          key,
          direction: current.direction === "asc" ? "desc" : "asc",
        };
      }
      return {
        key,
        direction: key === "rank" ? "asc" : "desc",
      };
    });
    setRequestedPage(1);
  }, []);

  const selectPlayer = useCallback((playerId: string) => {
    setSelectedPlayerId(playerId);
  }, []);

  const rangedLabel =
    filteredPlayers.length > 0
      ? `Showing ${(currentPage - 1) * PLAYERS_PER_PAGE + 1}–${
          (currentPage - 1) * PLAYERS_PER_PAGE + visiblePlayers.length
        } of ${filteredPlayers.length} players`
      : "0 players found";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Updated <LocalDateTime iso={data.updatedAt} />
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="gap-1.5"
        >
          <RefreshCw
            className={cn("h-4 w-4", isRefreshing && "animate-spin")}
            aria-hidden="true"
          />
          Refresh
        </Button>
      </div>

      <LeaderboardPodium
        highlights={highlights}
        scope={highlightScope}
        onScopeChange={setHighlightScope}
        onSelectPlayer={selectPlayer}
        highlightedName={highlightedName}
      />

      <div className="flex items-center gap-2">
        <PlayerNameSearch
          id="leaderboard-search"
          value={filters.query}
          onChange={(query) => updateFilter("query", query)}
          players={data.players}
          onSelectPlayer={selectPlayer}
          maxLength={32}
        />
        <Select
          value={filters.tier}
          onValueChange={(value) =>
            updateFilter("tier", value as LeaderboardRankTier | "all")
          }
        >
          <SelectTrigger
            id="leaderboard-tier"
            aria-label="Rank tier"
            className="h-10 min-h-10 w-[9.5rem] shrink-0 rounded-lg border-input/80 bg-background/80 px-3 text-base sm:w-[11.5rem] md:text-sm"
          >
            <SelectValue placeholder="All tiers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All tiers</SelectItem>
            {RANK_TIER_ORDER.map((tier) => (
              <SelectItem key={tier} value={tier}>
                <span className="flex items-center gap-2">
                  <RankTierMark tier={tier} size={20} />
                  {RANK_TIER_LABELS[tier]}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div
        ref={listTopRef}
        className="flex min-h-[2.25rem] items-center justify-between gap-2 text-sm text-muted-foreground"
      >
        <span aria-live="polite">{rangedLabel}</span>
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

      {filteredPlayers.length > 0 ? (
        <div
          className={cn(
            "space-y-2 transition-opacity",
            isUpdating && "opacity-60",
          )}
        >
          {visiblePlayers.map((player) => (
            <LeaderboardRow
              key={player.id}
              player={player}
              isHighlighted={namesMatch(player.name, highlightedName)}
              onSelect={selectPlayer}
            />
          ))}
          <LeaderboardTable
            players={visiblePlayers}
            sort={sort}
            onSort={handleSort}
            onSelectPlayer={selectPlayer}
            highlightedName={highlightedName}
          />
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border px-4 py-12 text-center text-sm text-muted-foreground">
          No players match those filters.
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
        players={[...data.players, ...(data.unlistedPlayers ?? [])]}
        matches={data.matches}
        open={selectedPlayerId !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedPlayerId(null);
        }}
      />
    </div>
  );
}
