"use client";

import { memo, useCallback, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { MATCH_TEAM_LABELS, SCOREBOARD_PAGES } from "@/lib/mock-matches";
import type {
  MatchGame,
  MatchTeamSide,
  ScoreboardPlayer,
  ScoreboardSort,
} from "@/types";

import { SortableColumnHeader } from "./sortable-column-header";

const TEAM_ROW_CLASSES: Record<MatchTeamSide, string> = {
  lineage: "bg-team-red/25 hover:bg-team-red/35",
  rna: "bg-team-blue/25 hover:bg-team-blue/35",
};

const TEAM_BADGE_CLASSES: Record<MatchTeamSide, string> = {
  lineage: "bg-team-red",
  rna: "bg-team-blue",
};

function formatStat(value: number, isCurrency?: boolean): string {
  return isCurrency ? `$${value.toLocaleString("en-US")}` : String(value);
}

/** Highest bonus $ across both teams first, like the in-game scoreboard. */
const DEFAULT_SORT: ScoreboardSort = { key: "bonusTotal", direction: "desc" };

function comparePlayers(
  first: ScoreboardPlayer,
  second: ScoreboardPlayer,
  sort: ScoreboardSort,
): number {
  const directionFactor = sort.direction === "asc" ? 1 : -1;
  const primary =
    sort.key === "player"
      ? first.name.localeCompare(second.name)
      : first[sort.key] - second[sort.key];

  if (primary !== 0) return primary * directionFactor;
  // Stable tie-breakers: more kills first, then name.
  return second.kills - first.kills || first.name.localeCompare(second.name);
}

interface ScoreboardProps {
  game: MatchGame;
}

/** Mirrors the in-game scoreboard: header, paged stat tables, team-tinted rows. */
export const Scoreboard = memo(function Scoreboard({ game }: ScoreboardProps) {
  const [pageIndex, setPageIndex] = useState(0);
  const page = SCOREBOARD_PAGES[pageIndex];

  const showPreviousPage = useCallback(() => {
    setPageIndex(
      (current) =>
        (current - 1 + SCOREBOARD_PAGES.length) % SCOREBOARD_PAGES.length,
    );
  }, []);

  const showNextPage = useCallback(() => {
    setPageIndex((current) => (current + 1) % SCOREBOARD_PAGES.length);
  }, []);

  const [sort, setSort] = useState<ScoreboardSort>(DEFAULT_SORT);

  const toggleSort = useCallback((key: ScoreboardSort["key"]) => {
    setSort((current) =>
      current.key === key
        ? { key, direction: current.direction === "asc" ? "desc" : "asc" }
        : // Names read A-Z first; stats read highest first.
          { key, direction: key === "player" ? "asc" : "desc" },
    );
  }, []);

  const sortedPlayers = useMemo<ScoreboardPlayer[]>(
    () =>
      [...game.players].sort((first, second) =>
        comparePlayers(first, second, sort),
      ),
    [game.players, sort],
  );

  const winnerLabel = MATCH_TEAM_LABELS[game.winningTeam];
  const loserSide: MatchTeamSide =
    game.winningTeam === "lineage" ? "rna" : "lineage";

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-background/60">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-secondary/60 px-3 py-2 sm:px-4">
        <p className="text-sm font-semibold sm:text-base">
          {winnerLabel} won, {game.score[game.winningTeam]}-
          {game.score[loserSide]}
        </p>
        <p className="text-xs text-muted-foreground sm:text-sm">
          {game.mode} {game.clock}
        </p>
      </div>

      <div className="flex items-center justify-between border-b border-border px-2 py-2">
        <button
          type="button"
          onClick={showPreviousPage}
          aria-label="Previous scoreboard page"
          className="flex h-11 w-11 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-widest sm:text-sm">
            {page.title}
          </p>
          <p className="text-[11px] text-muted-foreground">
            Page {pageIndex + 1} of {SCOREBOARD_PAGES.length}
          </p>
        </div>
        <button
          type="button"
          onClick={showNextPage}
          aria-label="Next scoreboard page"
          className="flex h-11 w-11 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {page.columns ? (
        <div className="overflow-x-auto">
          <table className="w-full text-[13px] sm:text-base">
            <thead className="border-b border-border bg-secondary/40">
              <tr className="text-left text-[11px] font-semibold text-muted-foreground sm:text-xs">
                <SortableColumnHeader
                  label="Player"
                  align="left"
                  direction={sort.key === "player" ? sort.direction : undefined}
                  onSort={() => toggleSort("player")}
                  className="px-0"
                />
                {page.columns.map((column) => (
                  <SortableColumnHeader
                    key={column.key}
                    label={column.label}
                    shortLabel={column.shortLabel}
                    direction={
                      sort.key === column.key ? sort.direction : undefined
                    }
                    onSort={() => toggleSort(column.key)}
                    className="px-0"
                  />
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedPlayers.map((player) => (
                <tr
                  key={`${player.team}-${player.name}`}
                  className={cn(
                    "transition-colors",
                    TEAM_ROW_CLASSES[player.team],
                  )}
                >
                  <th
                    scope="row"
                    className="w-full max-w-0 px-2 py-3 text-left font-semibold tracking-tight sm:w-auto sm:max-w-none sm:px-4"
                  >
                    <span className="flex items-center gap-1.5 sm:gap-2">
                      <span
                        className={cn(
                          "h-2.5 w-2.5 shrink-0 rounded-full",
                          TEAM_BADGE_CLASSES[player.team],
                        )}
                        aria-hidden="true"
                      />
                      <span className="truncate">{player.name}</span>
                      <span className="sr-only">
                        ({MATCH_TEAM_LABELS[player.team]})
                      </span>
                    </span>
                  </th>
                  {page.columns?.map((column) => (
                    <td
                      key={column.key}
                      className="px-1 py-3 text-right font-medium tabular-nums sm:px-4"
                    >
                      {formatStat(player[column.key], column.isCurrency)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="px-4 py-10 text-center text-sm text-muted-foreground">
          This scoreboard page is not mocked up yet. It will use the real
          in-game page once it is available.
        </p>
      )}
    </div>
  );
});
