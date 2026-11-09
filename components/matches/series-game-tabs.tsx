"use client";

import { memo, useState } from "react";

import { cn } from "@/lib/utils";
import { MATCH_TEAM_LABELS } from "@/lib/mock-matches";
import type { MatchSeries } from "@/types";

import { Scoreboard } from "./scoreboard";

interface SeriesGameTabsProps {
  series: MatchSeries;
}

/** Game 1 / 2 / 3 switcher for a best-of-three series. */
export const SeriesGameTabs = memo(function SeriesGameTabs({
  series,
}: SeriesGameTabsProps) {
  const [activeGameIndex, setActiveGameIndex] = useState(0);
  const activeGame = series.games[activeGameIndex] ?? series.games[0];

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
              key={game.gameNumber}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveGameIndex(gameIndex)}
              className={cn(
                "min-h-[2.5rem] flex-1 rounded-md border px-3 py-2 text-sm transition-colors sm:flex-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isActive
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-secondary/50 text-muted-foreground hover:text-foreground",
              )}
            >
              Game {game.gameNumber}
              <span className="ml-2 hidden text-xs opacity-80 sm:inline">
                {game.mapName} · {MATCH_TEAM_LABELS[game.winningTeam]}
              </span>
            </button>
          );
        })}
      </div>
      {/* key resets scoreboard paging when switching games */}
      <Scoreboard key={activeGame.gameNumber} game={activeGame} />
    </div>
  );
});
