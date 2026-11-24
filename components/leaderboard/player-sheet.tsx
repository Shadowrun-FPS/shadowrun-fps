"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";

import { PlayerIdentity } from "@/components/leaderboard/rank-tier-mark";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatMatchDateTime } from "@/lib/match-date";
import {
  didPlayerWin,
  formatElo,
  formatKd,
  formatPercent,
  formatStatAverage,
  getPlayerMatches,
} from "@/lib/leaderboard-stats";
import { cn } from "@/lib/utils";
import type { LeaderboardMatch, LeaderboardPlayer } from "@/types";

const GAMES_PAGE_SIZE = 8;

interface PlayerSheetProps {
  player: LeaderboardPlayer | null;
  matches: LeaderboardMatch[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
      <p className="text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-semibold tabular-nums">{value}</p>
    </div>
  );
}

export const PlayerSheet = memo(function PlayerSheet({
  player,
  matches,
  open,
  onOpenChange,
}: PlayerSheetProps) {
  const allMatches = useMemo(
    () => (player ? getPlayerMatches(matches, player.id) : []),
    [player, matches],
  );
  const [visibleCount, setVisibleCount] = useState(GAMES_PAGE_SIZE);

  useEffect(() => {
    setVisibleCount(GAMES_PAGE_SIZE);
  }, [player?.id]);

  const visibleMatches = allMatches.slice(0, visibleCount);
  const remaining = allMatches.length - visibleCount;

  const loadMore = useCallback(() => {
    setVisibleCount((current) => current + GAMES_PAGE_SIZE);
  }, []);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex h-[100dvh] max-h-[100dvh] w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-md top-0 bottom-auto"
      >
        {player ? (
          <>
            <SheetHeader className="shrink-0 space-y-2 px-6 pb-4 pt-6 pr-14 text-left">
              <SheetTitle className="text-2xl tracking-tight">
                <PlayerIdentity
                  name={player.name}
                  tier={player.tier}
                  markSize={36}
                  nameClassName="text-2xl font-semibold tracking-tight"
                />
              </SheetTitle>
              <SheetDescription>Rank {player.rank}</SheetDescription>
            </SheetHeader>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pb-6">
              <div className="grid grid-cols-2 gap-2">
                <StatCell label="Elo" value={formatElo(player.elo)} />
                <StatCell
                  label="Record"
                  value={`${player.wins}–${player.losses}`}
                />
                <StatCell label="Win %" value={formatPercent(player.winRate)} />
                <StatCell label="K/D" value={formatKd(player.kd)} />
                <StatCell
                  label="Accuracy"
                  value={formatPercent(player.accuracy)}
                />
                <StatCell
                  label="Avg kills"
                  value={formatStatAverage(player.avgKills)}
                />
                <StatCell
                  label="Resurrects"
                  value={player.totals.resurrects.toLocaleString("en-US")}
                />
                <StatCell
                  label="Bonus $"
                  value={`$${Math.round(player.totals.scoreboardBonus).toLocaleString("en-US")}`}
                />
              </div>

              <section className="mt-5 space-y-2">
                <h3 className="text-sm font-medium">Recent Games</h3>
                {allMatches.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No recent ranked matches in this snapshot.
                  </p>
                ) : (
                  <>
                    <ul className="space-y-2">
                      {visibleMatches.map((match) => {
                        const won = didPlayerWin(match, player.id);
                        const entry = match.players.find(
                          (matchPlayer) => matchPlayer.id === player.id,
                        );
                        const eloChange = entry?.eloChange ?? 0;
                        const eloLabel =
                          eloChange > 0
                            ? `+${eloChange.toFixed(0)}`
                            : eloChange.toFixed(0);

                        return (
                          <li
                            key={match.id}
                            className="rounded-lg border border-border/60 px-3 py-2"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span
                                className={cn(
                                  "rounded-md px-1.5 py-0.5 text-xs font-semibold",
                                  won === true && "bg-primary/15 text-primary",
                                  won === false &&
                                    "bg-destructive/15 text-destructive",
                                  won === null &&
                                    "bg-muted text-muted-foreground",
                                )}
                              >
                                {won === true ? "W" : won === false ? "L" : "—"}
                              </span>
                              <span
                                className={cn(
                                  "text-sm font-semibold tabular-nums",
                                  eloChange > 0 && "text-primary",
                                  eloChange < 0 && "text-destructive",
                                )}
                              >
                                {eloLabel}
                              </span>
                            </div>
                            <p className="mt-1 truncate text-sm">
                              {match.map} · {match.mode}
                            </p>
                            <p className="text-xs tabular-nums text-muted-foreground">
                              {match.score[0]}–{match.score[1]} ·{" "}
                              {formatMatchDateTime(match.finishedAt)}
                            </p>
                          </li>
                        );
                      })}
                    </ul>
                    {remaining > 0 ? (
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={loadMore}
                      >
                        Load More
                      </Button>
                    ) : null}
                  </>
                )}
              </section>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
});
