"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { ChevronDown, Trophy } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { RANKED_TEAM_LABELS } from "@/lib/leaderboard-stats";
import { formatMatchDateTime } from "@/lib/match-date";
import { cn } from "@/lib/utils";
import type { RankedMatchGame, RankedMatchSeries, RankedTeamId } from "@/types";

const SeriesGameTabs = dynamic(() =>
  import("./series-game-tabs").then((module) => module.SeriesGameTabs),
);

interface SeriesCardProps {
  series: RankedMatchSeries;
  defaultExpanded?: boolean;
  initialGameId?: string | null;
  onSelectPlayer?: (playerId: string) => void;
  selectablePlayerIds?: ReadonlySet<string>;
}

function scoreText(team: RankedTeamId, value: number): string {
  return `${RANKED_TEAM_LABELS[team]} ${value}`;
}

function MapThumb({ game }: { game: RankedMatchGame }) {
  if (!game.mapImage) {
    return (
      <div
        className="h-16 w-24 rounded border border-border bg-muted/40"
        aria-hidden="true"
      />
    );
  }

  return (
    <div className="relative h-16 w-24 overflow-hidden rounded border border-border bg-black">
      <Image
        src={game.mapImage}
        alt={game.mapName}
        fill
        sizes="96px"
        loading="lazy"
        className="origin-[68%_42%] scale-[1.7] object-cover object-[68%_42%]"
      />
    </div>
  );
}

/** One ranked match, or a best-of-three series when the export groups games. */
export const SeriesCard = memo(function SeriesCard({
  series,
  defaultExpanded = false,
  initialGameId = null,
  onSelectPlayer,
  selectablePlayerIds,
}: SeriesCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const cardRef = useRef<HTMLDivElement>(null);
  const didScroll = useRef(false);
  const toggleExpanded = useCallback(
    () => setIsExpanded((current) => !current),
    [],
  );
  const detailsId = `series-details-${series.id}`;
  const isSeries = series.format === "bo3";
  const leadGame = series.games[0];
  const lineageScore = isSeries
    ? series.seriesScore[1]
    : (leadGame?.score[1] ?? 0);
  const rnaScore = isSeries ? series.seriesScore[0] : (leadGame?.score[0] ?? 0);

  useEffect(() => {
    if (defaultExpanded) setIsExpanded(true);
  }, [defaultExpanded]);

  useEffect(() => {
    if (!defaultExpanded || didScroll.current) return;
    didScroll.current = true;
    cardRef.current?.scrollIntoView({ block: "center" });
  }, [defaultExpanded]);

  return (
    <Card ref={cardRef} id={`match-${series.id}`} className="overflow-hidden">
      <button
        type="button"
        onClick={toggleExpanded}
        aria-expanded={isExpanded}
        aria-controls={detailsId}
        className="flex w-full flex-col gap-3 p-4 text-left transition-colors hover:bg-secondary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground">
            {formatMatchDateTime(series.playedAt)}
            {" · "}
            {isSeries ? "Ranked Best of 3" : (leadGame?.mode ?? "Ranked")}
            {!isSeries && leadGame?.rankedNumber
              ? ` · #${leadGame.rankedNumber}`
              : ""}
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-lg font-semibold">
            <span className="text-team-red">{scoreText(1, lineageScore)}</span>
            <span className="text-muted-foreground">–</span>
            <span className="text-team-blue">{scoreText(0, rnaScore)}</span>
            {series.winner != null ? (
              <Badge variant="secondary" className="gap-1">
                <Trophy className="h-3 w-3" aria-hidden="true" />
                {RANKED_TEAM_LABELS[series.winner]} won
              </Badge>
            ) : (
              <Badge variant="secondary">Tied</Badge>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 sm:justify-end">
          <div className="flex gap-2" aria-label="Maps played">
            {series.games.map((game) => (
              <div key={game.id} className="text-center">
                <MapThumb game={game} />
                <span className="mt-0.5 block w-24 truncate text-[10px] text-muted-foreground">
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
          <SeriesGameTabs
            series={series}
            initialGameId={initialGameId}
            onSelectPlayer={onSelectPlayer}
            selectablePlayerIds={selectablePlayerIds}
          />
        </div>
      ) : null}
    </Card>
  );
});
