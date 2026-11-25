"use client";

import { memo, useCallback, useMemo, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

import { EloChange } from "@/components/leaderboard/elo-change";
import { cn } from "@/lib/utils";
import { RANKED_TEAM_LABELS, formatBonus } from "@/lib/leaderboard-stats";
import {
  SCOREBOARD_PAGES,
  defaultScoreboardSort,
  playerHasScoreboard,
  type ScoreboardValueKind,
} from "@/lib/scoreboard-pages";
import type {
  MatchScoreboardPlayer,
  RankedMatchGame,
  RankedTeamId,
  ScoreboardSort,
} from "@/types";

import { ScoreboardPlayerName } from "./scoreboard-player-name";
import { SortableColumnHeader } from "./sortable-column-header";

const TEAM_ROW_CLASSES: Record<RankedTeamId, string> = {
  0: "bg-team-blue/25 hover:bg-team-blue/35",
  1: "bg-team-red/25 hover:bg-team-red/35",
};

function formatPercentPoints(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? `${rounded}%` : `${rounded.toFixed(1)}%`;
}

function formatCell(value: number | null, kind: ScoreboardValueKind): string {
  if (value == null) return "—";
  if (kind === "currency") return formatBonus(value);
  if (kind === "percent") return formatPercentPoints(value);
  return Number.isInteger(value)
    ? value.toLocaleString("en-US")
    : value.toFixed(1);
}

function readNothing(): number | null {
  return null;
}

function comparePlayers(
  first: MatchScoreboardPlayer,
  second: MatchScoreboardPlayer,
  sort: ScoreboardSort,
  read: (player: MatchScoreboardPlayer) => number | null,
): number {
  if (sort.key === "player") {
    const byName = first.name.localeCompare(second.name);
    return sort.direction === "asc" ? byName : -byName;
  }

  const firstValue = read(first);
  const secondValue = read(second);
  if (firstValue == null && secondValue == null) {
    return first.name.localeCompare(second.name);
  }
  if (firstValue == null) return 1;
  if (secondValue == null) return -1;

  const directionFactor = sort.direction === "asc" ? 1 : -1;
  const delta = (firstValue - secondValue) * directionFactor;
  if (delta !== 0) return delta;
  return first.name.localeCompare(second.name);
}

interface ScoreboardProps {
  game: RankedMatchGame;
  onSelectPlayer?: (playerId: string) => void;
  selectablePlayerIds?: ReadonlySet<string>;
}

/** Mirrors the in-game scoreboard: header, paged stat tables, team-tinted rows. */
export const Scoreboard = memo(function Scoreboard({
  game,
  onSelectPlayer,
  selectablePlayerIds,
}: ScoreboardProps) {
  const [pageIndex, setPageIndex] = useState(0);
  const page = SCOREBOARD_PAGES[pageIndex] ?? SCOREBOARD_PAGES[0];
  const [sort, setSort] = useState<ScoreboardSort>(() =>
    defaultScoreboardSort(page),
  );
  const [sortPageId, setSortPageId] = useState(page.id);
  if (sortPageId !== page.id) {
    setSortPageId(page.id);
    setSort(defaultScoreboardSort(page));
  }

  const showPreviousPage = useCallback(() => {
    setPageIndex(
      (current) =>
        (current - 1 + SCOREBOARD_PAGES.length) % SCOREBOARD_PAGES.length,
    );
  }, []);

  const showNextPage = useCallback(() => {
    setPageIndex((current) => (current + 1) % SCOREBOARD_PAGES.length);
  }, []);

  const toggleSort = useCallback((key: string) => {
    setSort((current) =>
      current.key === key
        ? { key, direction: current.direction === "asc" ? "desc" : "asc" }
        : { key, direction: key === "player" ? "asc" : "desc" },
    );
  }, []);

  const sortedPlayers = useMemo(() => {
    const column = page.columns.find((entry) => entry.id === sort.key);
    const read =
      sort.key === "elo"
        ? (player: MatchScoreboardPlayer) => player.eloChange
        : (column?.read ?? readNothing);
    return [...game.players].sort((first, second) =>
      comparePlayers(first, second, sort, read),
    );
  }, [game.players, page.columns, sort]);

  const hasScoreboard = game.players.some(playerHasScoreboard);
  const loserTeam: RankedTeamId = game.winningTeam === 1 ? 0 : 1;

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-background/60">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-secondary/60 px-3 py-2 sm:px-4">
        <p className="text-sm font-semibold sm:text-base">
          {RANKED_TEAM_LABELS[game.winningTeam]} won,{" "}
          {game.score[game.winningTeam]}-{game.score[loserTeam]}
        </p>
        <p className="text-xs text-muted-foreground sm:text-sm">{game.mode}</p>
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

      {hasScoreboard ? (
        <>
          <div className="flex items-center gap-2 border-b border-border px-3 py-2 lg:hidden">
            <label
              htmlFor={`scoreboard-sort-${game.id}`}
              className="shrink-0 text-xs text-muted-foreground"
            >
              Sort
            </label>
            <div className="relative min-w-0 flex-1">
              <select
                id={`scoreboard-sort-${game.id}`}
                value={sort.key}
                onChange={(event) => toggleSort(event.target.value)}
                className="h-10 w-full appearance-none rounded-md border border-input bg-background pl-3 pr-10 text-sm"
              >
                <option value="player">Player</option>
                <option value="elo">Elo</option>
                {page.columns.map((column) => (
                  <option key={column.id} value={column.id}>
                    {column.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
            </div>
            <button
              type="button"
              onClick={() => toggleSort(sort.key)}
              className="h-10 shrink-0 rounded-md border border-border px-3 text-xs font-medium uppercase tracking-wide"
            >
              {sort.direction === "asc" ? "Asc" : "Desc"}
            </button>
          </div>

          <ul className="flex flex-col gap-2 bg-background/80 p-2 lg:hidden">
            {sortedPlayers.map((player) => (
              <li
                key={player.id}
                className={cn(
                  "rounded-md px-3 py-3 ring-1 ring-inset ring-white/15",
                  TEAM_ROW_CLASSES[player.team],
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <ScoreboardPlayerName
                    player={player}
                    onSelectPlayer={
                      selectablePlayerIds?.has(player.id)
                        ? onSelectPlayer
                        : undefined
                    }
                  />
                  <EloChange change={player.eloChange} className="pt-0.5 text-sm" />
                </div>
                <dl className="mt-2 grid grid-cols-3 gap-x-3 gap-y-2 min-[480px]:grid-cols-[repeat(auto-fit,minmax(7rem,1fr))]">
                  {page.columns.map((column) => (
                    <div key={column.id} className="min-w-0">
                      <dt className="truncate text-[10px] font-semibold uppercase tracking-wide text-muted-foreground min-[350px]:text-[11px]">
                        {column.preferShortOnCard ? (
                          column.shortLabel
                        ) : (
                          <>
                            <span className="min-[350px]:hidden">
                              {column.shortLabel}
                            </span>
                            <span className="hidden min-[350px]:inline">
                              {column.label}
                            </span>
                          </>
                        )}
                      </dt>
                      <dd className="text-sm font-medium tabular-nums">
                        {formatCell(column.read(player), column.kind)}
                      </dd>
                    </div>
                  ))}
                </dl>
              </li>
            ))}
          </ul>

          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[40rem] text-sm lg:text-base">
              <thead className="border-b border-border bg-secondary/40">
                <tr className="text-left text-xs font-semibold text-muted-foreground">
                  <SortableColumnHeader
                    label="Player"
                    align="left"
                    direction={
                      sort.key === "player" ? sort.direction : undefined
                    }
                    onSort={() => toggleSort("player")}
                    className="px-0"
                  />
                  <SortableColumnHeader
                    label="Elo"
                    direction={sort.key === "elo" ? sort.direction : undefined}
                    onSort={() => toggleSort("elo")}
                    className="px-0"
                  />
                  {page.columns.map((column) => (
                    <SortableColumnHeader
                      key={column.id}
                      label={column.label}
                      shortLabel={column.shortLabel}
                      direction={
                        sort.key === column.id ? sort.direction : undefined
                      }
                      onSort={() => toggleSort(column.id)}
                      className="px-0"
                    />
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedPlayers.map((player) => (
                  <tr
                    key={player.id}
                    className={cn(
                      "transition-colors",
                      TEAM_ROW_CLASSES[player.team],
                    )}
                  >
                    <th
                      scope="row"
                      className="min-w-[10rem] px-4 py-3 text-left font-semibold tracking-tight"
                    >
                      <ScoreboardPlayerName
                        player={player}
                        onSelectPlayer={
                          selectablePlayerIds?.has(player.id)
                            ? onSelectPlayer
                            : undefined
                        }
                      />
                    </th>
                    <td className="whitespace-nowrap px-3 py-3 text-right">
                      <EloChange change={player.eloChange} />
                    </td>
                    {page.columns.map((column) => (
                      <td
                        key={column.id}
                        className="whitespace-nowrap px-3 py-3 text-right font-medium tabular-nums"
                      >
                        {formatCell(column.read(player), column.kind)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <p className="px-4 py-10 text-center text-sm text-muted-foreground">
          No end-game stats for this match.
        </p>
      )}
    </div>
  );
});
