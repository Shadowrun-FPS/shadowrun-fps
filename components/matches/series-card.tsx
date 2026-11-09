"use client";

import { memo, useCallback, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { ChevronDown, Trophy } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatMatchDateTime } from "@/lib/match-date";
import { MATCH_TEAM_LABELS } from "@/lib/mock-matches";
import type { MatchSeries } from "@/types";

// Scoreboard code only loads when a series is expanded.
const SeriesGameTabs = dynamic(() =>
  import("./series-game-tabs").then((module) => module.SeriesGameTabs),
);

interface SeriesCardProps {
  series: MatchSeries;
}

/** One ranked best-of-three series; expands to show each game's scoreboard. */
export const SeriesCard = memo(function SeriesCard({
  series,
}: SeriesCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const toggleExpanded = useCallback(
    () => setIsExpanded((current) => !current),
    [],
  );
  const detailsId = `series-details-${series.id}`;

  return (
    <Card className="overflow-hidden">
      <button
        type="button"
        onClick={toggleExpanded}
        aria-expanded={isExpanded}
        aria-controls={detailsId}
        className="flex w-full flex-col gap-3 p-4 text-left transition-colors hover:bg-secondary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground">
            {formatMatchDateTime(series.playedAt)} · Ranked Best of 3
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-lg font-semibold">
            <span className="text-team-red">{MATCH_TEAM_LABELS.lineage}</span>
            <span className="tabular-nums">
              {series.seriesScore.lineage} - {series.seriesScore.rna}
            </span>
            <span className="text-team-blue">{MATCH_TEAM_LABELS.rna}</span>
            <Badge variant="secondary" className="gap-1">
              <Trophy className="h-3 w-3" aria-hidden="true" />
              {MATCH_TEAM_LABELS[series.winner]} won
            </Badge>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 sm:justify-end">
          <div className="flex gap-2" aria-label="Maps played">
            {series.games.map((game) => (
              <div key={game.gameNumber} className="text-center">
                <Image
                  src={game.mapImage}
                  alt={game.mapName}
                  width={64}
                  height={40}
                  loading="lazy"
                  className="h-10 w-16 rounded border border-border object-cover"
                />
                <span className="mt-0.5 block w-16 truncate text-[10px] text-muted-foreground">
                  {game.mapName}
                </span>
              </div>
            ))}
          </div>
          <ChevronDown
            className={cn(
              "h-5 w-5 shrink-0 text-muted-foreground transition-transform",
              isExpanded && "rotate-180",
            )}
            aria-hidden="true"
          />
        </div>
      </button>

      {isExpanded ? (
        <div id={detailsId} className="border-t border-border p-3 sm:p-4">
          <SeriesGameTabs series={series} />
        </div>
      ) : null}
    </Card>
  );
});
