"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Link2, RefreshCw, X } from "lucide-react";

import { MapBreakdown } from "@/components/compare/map-breakdown";
import { MatchEvidence } from "@/components/compare/match-evidence";
import { ComparisonTable } from "@/components/compare/metric-list";
import { RecentForm } from "@/components/compare/recent-form";
import { PlayerNameSearch } from "@/components/leaderboard/player-name-search";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { LocalDateTime } from "@/components/local-date-time";
import { MAX_COMPARE_PLAYERS } from "@/lib/compare/config";
import { buildMetricRows, statCoverageNote } from "@/lib/compare/present";
import {
  activeFilterCount,
  compareHref,
  emptyCompareQuery,
  parseCompareSearch,
  queriesEqual,
} from "@/lib/compare/query";
import { buildComparison, listMaps, listModes } from "@/lib/compare/sample";
import { cn } from "@/lib/utils";
import type { CompareQuery, CompareScope, CompareWindow } from "@/types/compare";
import type { LeaderboardPayload } from "@/types";

const WINDOWS: Array<{ id: CompareWindow; label: string }> = [
  { id: "all", label: "All recorded history" },
  { id: "30d", label: "Last 30 days" },
  { id: "7d", label: "Last 7 days" },
];

export function CompareBrowser({
  data,
  initialQuery,
  onRefresh,
  isRefreshing,
}: {
  data: LeaderboardPayload;
  initialQuery: CompareQuery;
  onRefresh: () => void;
  isRefreshing: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [query, setQuery] = useState(initialQuery);
  const [searchValue, setSearchValue] = useState("");

  const roster = useMemo(
    () => [...data.players, ...(data.unlistedPlayers ?? [])],
    [data.players, data.unlistedPlayers],
  );
  const byId = useMemo(() => new Map(roster.map((player) => [player.id, player])), [roster]);
  const names = useMemo(() => new Map(roster.map((player) => [player.id, player.name])), [roster]);
  const modes = useMemo(() => listModes(data.matches), [data.matches]);
  const maps = useMemo(() => listMaps(data.matches), [data.matches]);
  const searchKey = searchParams.toString();

  useEffect(() => {
    const parsed = parseCompareSearch(
      {
        players: searchParams.get("players"),
        window: searchParams.get("window"),
        map: searchParams.get("map"),
        mode: searchParams.get("mode"),
        scope: searchParams.get("scope"),
      },
      { playerIds: new Set(roster.map((player) => player.id)), maps: new Set(maps), modes },
    );
    setQuery((current) => (queriesEqual(current, parsed) ? current : parsed));
  }, [maps, modes, roster, searchKey, searchParams]);

  useEffect(() => {
    const href = compareHref(query);
    const current = `${window.location.pathname}${window.location.search}`;
    if (current !== href) router.replace(href, { scroll: false });
  }, [query, router]);

  const model = useMemo(() => buildComparison(data, query), [data, query]);
  const rows = useMemo(() => buildMetricRows(model.players), [model.players]);
  const coverageNote = useMemo(() => statCoverageNote(model.players, names), [model.players, names]);
  const people = useMemo(
    () =>
      query.playerIds.map((id) => ({
        id,
        name: names.get(id) ?? "Player",
        matches: model.players.find((sample) => sample.playerId === id)?.matches ?? 0,
      })),
    [model.players, names, query.playerIds],
  );
  const filterCount = activeFilterCount(query);
  const atLimit = query.playerIds.length >= MAX_COMPARE_PLAYERS;

  const selectable = roster.filter((player) => !query.playerIds.includes(player.id));

  const updateFilters = (partial: Partial<CompareQuery>) => {
    setQuery((current) => ({ ...current, ...partial }));
  };

  const addPlayer = (playerId: string) => {
    setQuery((current) => {
      if (current.playerIds.includes(playerId) || current.playerIds.length >= MAX_COMPARE_PLAYERS) {
        return current;
      }
      return { ...current, playerIds: [...current.playerIds, playerId] };
    });
    setSearchValue("");
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${compareHref(query)}`);
      toast({ title: "Link copied" });
    } catch {
      toast({ title: "Could not copy the link", variant: "destructive" });
    }
  };

  return (
    <div className="min-w-0 space-y-6 overflow-x-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Updated <LocalDateTime iso={data.updatedAt} />
        </p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => void copyLink()}>
            <Link2 aria-hidden="true" />
            Copy link
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={onRefresh} disabled={isRefreshing}>
            <RefreshCw className={cn(isRefreshing && "animate-spin motion-reduce:animate-none")} aria-hidden="true" />
            Refresh
          </Button>
        </div>
      </div>

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div className="min-w-0 flex-1">
            <PlayerNameSearch
              id="compare-player"
              value={searchValue}
              onChange={setSearchValue}
              players={selectable}
              onSelectPlayer={addPlayer}
              disabled={atLimit}
              placeholder={atLimit ? "Remove a player to add someone else" : "Add a player"}
              aria-label={atLimit ? "Remove a player to add someone else" : "Add a player to the comparison"}
            />
          </div>
          {query.playerIds.length > 0 ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="min-h-11"
              onClick={() => setQuery((current) => ({ ...current, playerIds: [] }))}
            >
              Clear
            </Button>
          ) : null}
        </div>
        {atLimit ? (
          <p className="text-sm text-muted-foreground">4 players is the limit. Remove one to add someone else.</p>
        ) : null}
        {query.playerIds.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
            Add two to four players to compare recorded performances.
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-border/60 bg-border/60 md:grid-cols-2">
            {query.playerIds.map((id, index) => {
              const player = byId.get(id);
              const name = player?.name ?? "Player";
              const spansRow = query.playerIds.length % 2 === 1 && index === query.playerIds.length - 1;
              return (
                <li
                  key={id}
                  className={cn("flex min-w-0 items-center gap-1 bg-card pl-3", spansRow && "md:col-span-2")}
                >
                  <Link
                    href={`/leaderboard?player=${id}`}
                    className="min-w-0 flex-1 truncate py-3 text-sm font-medium underline-offset-4 hover:underline"
                    title={name}
                  >
                    {name}
                  </Link>
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-11 w-11 shrink-0 px-0 sm:w-auto sm:px-3"
                    aria-label={`Remove ${name}`}
                    onClick={() =>
                      setQuery((current) => ({
                        ...current,
                        playerIds: current.playerIds.filter((playerId) => playerId !== id),
                      }))
                    }
                  >
                    <X aria-hidden="true" />
                    <span className="sr-only sm:not-sr-only">Remove</span>
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
        {query.playerIds.length === 1 ? (
          <p className="text-sm text-muted-foreground">Add another player to compare these records.</p>
        ) : null}
      </section>

      <section className="space-y-3">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <FilterField
            id="compare-time"
            label="Time"
            value={query.window}
            onValueChange={(value) => updateFilters({ window: value as CompareWindow })}
            options={WINDOWS}
          />
          <FilterField
            id="compare-map"
            label="Map"
            value={query.map ?? "all"}
            onValueChange={(value) => updateFilters({ map: value === "all" ? null : value })}
            options={[{ id: "all", label: "All maps" }, ...maps.map((map) => ({ id: map, label: map }))]}
          />
          <FilterField
            id="compare-scope"
            label="Matches"
            value={query.scope}
            onValueChange={(value) => updateFilters({ scope: value as CompareScope })}
            options={[
              { id: "own", label: "Each player's matches" },
              { id: "shared", label: "Shared matches only" },
            ]}
            />
          {filterCount > 0 ? (
            <div className="flex items-end">
              <Button
                type="button"
                variant="ghost"
                className="h-10 px-3"
                onClick={() => setQuery((current) => ({ ...emptyCompareQuery(), playerIds: current.playerIds }))}
              >
                Reset filters
              </Button>
            </div>
          ) : null}
          {modes.length > 1 ? (
            <FilterField
              id="compare-mode"
              label="Mode"
              value={query.mode ?? "all"}
              onValueChange={(value) => updateFilters({ mode: value === "all" ? null : value })}
              options={[{ id: "all", label: "All modes" }, ...modes.map((mode) => ({ id: mode, label: mode }))]}
            />
          ) : null}
        </div>
        <p className="text-sm text-muted-foreground">
          {query.scope === "shared"
            ? "Shared matches only includes games where every selected player was seated, on either team."
            : "Each player’s matches uses that player’s own games. Sample sizes can differ."}{" "}
          Numbers come from this snapshot, which may not be a complete career.
        </p>
      </section>

      {model.emptyShared ? (
        <div className="space-y-3 rounded-xl border border-dashed border-border px-4 py-8 text-center">
          <p className="text-sm text-muted-foreground">
            No recorded match contains every selected player with these filters.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {query.window !== "all" ? (
              <Button type="button" size="sm" variant="outline" onClick={() => updateFilters({ window: "all" })}>
                Use all recorded history
              </Button>
            ) : null}
            {query.map ? (
              <Button type="button" size="sm" variant="outline" onClick={() => updateFilters({ map: null })}>
                Clear map filter
              </Button>
            ) : null}
            <Button type="button" size="sm" variant="outline" onClick={() => updateFilters({ scope: "own" })}>
              Use each player’s matches
            </Button>
          </div>
        </div>
      ) : query.playerIds.length > 0 ? (
        <>
          <ComparisonTable rows={rows} people={people} />
          {coverageNote ? <p className="text-xs text-muted-foreground">{coverageNote}</p> : null}
          <RecentForm players={model.players} names={names} scope={query.scope} />
          <MapBreakdown players={model.players} names={names} />
          <MatchEvidence players={model.players} names={names} scope={query.scope} />
        </>
      ) : null}
    </div>
  );
}

function FilterField({
  id,
  label,
  value,
  onValueChange,
  options,
}: {
  id: string;
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: Array<{ id: string; label: string }>;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id} className="text-xs text-muted-foreground">
        {label}
      </Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger id={id}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.id} value={option.id}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
