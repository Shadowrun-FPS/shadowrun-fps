"use client";

import { memo, useState } from "react";

import { RANKED_TEAM_LABELS } from "@/lib/leaderboard-stats";
import { cn } from "@/lib/utils";
import type { RankedMatchSeries } from "@/types";

import { Scoreboard } from "./scoreboard";

interface SeriesGameTabsProps {
  series: RankedMatchSeries;
  initialGameId?: string | null;
  onSelectPlayer?: (playerId: string) => void;
  selectablePlayerIds?: ReadonlySet<string>;
}

/** Game switcher for a best-of-three series. A single game skips the tabs. */
export const SeriesGameTabs = memo(function SeriesGameTabs({
  series,
  initialGameId,
  onSelectPlayer,
  selectablePlayerIds,
}: SeriesGameTabsProps) {
  const initialIndex = Math.max(
    0,
    series.games.findIndex((game) => game.id === initialGameId),
  );
  const [activeGameIndex, setActiveGameIndex] = useState(initialIndex);
  const activeGame = series.games[activeGameIndex] ?? series.games[0];

  if (!activeGame) return null;

  if (series.games.length < 2) {
    return (
      <Scoreboard
        game={activeGame}
        onSelectPlayer={onSelectPlayer}
        selectablePlayerIds={selectablePlayerIds}
      />
    );
  }

  return (
    <div className="space-y-3">
      <div
        role="tablist"
        aria-label="Games in this series"
        className="flex flex-wrap gap-2"
      >
        {series.games.map((game, gameIndex) => {
          const isActive = gameIndex === activeGameIndex;
          return (
            <button
              key={game.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveGameIndex(gameIndex)}
              className={cn(
                "min-h-[2.5rem] flex-1 rounded-md border px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex-none",
                isActive
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-secondary/50 text-muted-foreground hover:text-foreground",
              )}
            >
              Game {game.gameNumber}
              <span className="ml-2 hidden text-xs opacity-80 sm:inline">
                {game.mapName} · {RANKED_TEAM_LABELS[game.winningTeam]}
              </span>
            </button>
          );
        })}
      </div>
      <Scoreboard
        key={activeGame.id}
        game={activeGame}
        onSelectPlayer={onSelectPlayer}
        selectablePlayerIds={selectablePlayerIds}
      />
    </div>
  );
});
