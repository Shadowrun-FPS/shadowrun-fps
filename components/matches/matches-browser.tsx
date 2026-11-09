"use client";

import {
  useCallback,
  useDeferredValue,
  useMemo,
  useRef,
  useState,
} from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PaginationControls } from "@/components/ui/pagination-controls";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  DEFAULT_MATCH_FILTERS,
  MATCH_MAPS,
  MATCH_TEAM_LABELS,
  getMatches,
} from "@/lib/mock-matches";
import type { MatchFilters } from "@/types";

import { SeriesCard } from "./series-card";

const SERIES_PER_PAGE = 5;

/** Search, filter, and browse past ranked series (mock data for now). */
export function MatchesBrowser() {
  const [filters, setFilters] = useState<MatchFilters>(DEFAULT_MATCH_FILTERS);
  const deferredFilters = useDeferredValue(filters);
  const isUpdating = deferredFilters !== filters;

  const matches = useMemo(() => getMatches(deferredFilters), [deferredFilters]);

  const [requestedPage, setRequestedPage] = useState(1);
  const listTopRef = useRef<HTMLDivElement>(null);
  const pageCount = Math.max(1, Math.ceil(matches.length / SERIES_PER_PAGE));
  const currentPage = Math.min(requestedPage, pageCount);

  const visibleMatches = useMemo(
    () =>
      matches.slice(
        (currentPage - 1) * SERIES_PER_PAGE,
        currentPage * SERIES_PER_PAGE,
      ),
    [matches, currentPage],
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

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="relative min-w-0 flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id="match-search"
              type="search"
              aria-label="Search by player name"
              value={filters.query}
              onChange={(event) => updateFilter("query", event.target.value)}
              placeholder="Search player name"
              className="pl-9"
              maxLength={32}
            />
          </div>
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
            <Label
              htmlFor="match-map"
              className="text-xs text-muted-foreground"
            >
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
                {MATCH_MAPS.map((map) => (
                  <SelectItem key={map.id} value={map.id}>
                    {map.name}
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
              value={filters.winner}
              onValueChange={(value) =>
                updateFilter("winner", value as MatchFilters["winner"])
              }
            >
              <SelectTrigger id="match-winner">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Either team</SelectItem>
                <SelectItem value="lineage">
                  {MATCH_TEAM_LABELS.lineage}
                </SelectItem>
                <SelectItem value="rna">{MATCH_TEAM_LABELS.rna}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label
              htmlFor="match-from"
              className="text-xs text-muted-foreground"
            >
              From
            </Label>
            <Input
              id="match-from"
              type="date"
              value={filters.dateFrom}
              max={filters.dateTo || undefined}
              onChange={(event) => updateFilter("dateFrom", event.target.value)}
              className="min-w-0"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="match-to" className="text-xs text-muted-foreground">
              To
            </Label>
            <Input
              id="match-to"
              type="date"
              value={filters.dateTo}
              min={filters.dateFrom || undefined}
              onChange={(event) => updateFilter("dateTo", event.target.value)}
              className="min-w-0"
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
            ? `Showing ${(currentPage - 1) * SERIES_PER_PAGE + 1}-${
                (currentPage - 1) * SERIES_PER_PAGE + visibleMatches.length
              } of ${matches.length} series`
            : "0 series found"}
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
            <SeriesCard key={series.id} series={series} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border px-4 py-12 text-center text-sm text-muted-foreground">
          No ranked series match those filters.
        </div>
      )}

      <PaginationControls
        page={currentPage}
        pageCount={pageCount}
        onPageChange={handlePageChange}
        className="pt-2"
      />
    </div>
  );
}
