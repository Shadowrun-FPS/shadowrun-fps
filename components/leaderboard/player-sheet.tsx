"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft } from "lucide-react";

import { EloChange } from "@/components/leaderboard/elo-change";
import { MatchResults } from "@/components/leaderboard/match-results";
import { PlayerIdentity } from "@/components/leaderboard/rank-tier-mark";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { LocalDateTime } from "@/components/local-date-time";
import {
  didPlayerWin,
  formatBonus,
  formatElo,
  formatKd,
  formatPercent,
  formatPlayerMatchScore,
  formatStatAverage,
  getPlayerMatches,
  perStatsMatch,
} from "@/lib/leaderboard-stats";
import { cn } from "@/lib/utils";
import type { LeaderboardMatch, LeaderboardPlayer } from "@/types";

const GAMES_PAGE_SIZE = 8;

interface PlayerSheetProps {
  player: LeaderboardPlayer | null;
  players: LeaderboardPlayer[];
  matches: LeaderboardMatch[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Public standings rank. Hidden for players kept off the leaderboard. */
  showRank?: boolean;
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
  players,
  matches,
  open,
  onOpenChange,
  showRank = true,
}: PlayerSheetProps) {
  const allMatches = useMemo(
    () => (player ? getPlayerMatches(matches, player.id) : []),
    [player, matches],
  );
  const playerById = useMemo(() => {
    const byId = new Map<string, LeaderboardPlayer>();
    for (const entry of players) {
      byId.set(entry.id, entry);
    }
    return byId;
  }, [players]);

  const [visibleCount, setVisibleCount] = useState(GAMES_PAGE_SIZE);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setVisibleCount(GAMES_PAGE_SIZE);
    setSelectedMatchId(null);
  }, [player?.id]);

  useEffect(() => {
    if (!open) setSelectedMatchId(null);
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [selectedMatchId, player?.id]);

  const visibleMatches = allMatches.slice(0, visibleCount);
  const remaining = allMatches.length - visibleCount;
  const selectedMatch = useMemo(
    () =>
      selectedMatchId
        ? (allMatches.find((match) => match.id === selectedMatchId) ?? null)
        : null,
    [allMatches, selectedMatchId],
  );

  const loadMore = useCallback(() => {
    setVisibleCount((current) => current + GAMES_PAGE_SIZE);
  }, []);

  const openMatch = useCallback((matchId: string) => {
    setSelectedMatchId(matchId);
  }, []);

  const closeMatch = useCallback(() => {
    setSelectedMatchId(null);
  }, []);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className={cn(
          "flex h-[100dvh] max-h-[100dvh] w-full flex-col gap-0 overflow-hidden p-0 top-0 bottom-auto",
          selectedMatch ? "sm:max-w-xl md:max-w-2xl" : "sm:max-w-md",
        )}
      >
        {player ? (
          <>
            <SheetHeader className="shrink-0 space-y-2 px-6 pb-4 pt-6 pr-14 text-left">
              {selectedMatch ? (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={closeMatch}
                    className="-ml-2 w-fit gap-1 px-2"
                  >
                    <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                    Back
                  </Button>
                  <SheetTitle className="text-xl tracking-tight sm:text-2xl">
                    {selectedMatch.map}
                  </SheetTitle>
                  <SheetDescription>
                    {selectedMatch.mode} ·{" "}
                    <LocalDateTime iso={selectedMatch.finishedAt} />
                  </SheetDescription>
                </>
              ) : (
                <>
                  <SheetTitle className="text-2xl tracking-tight">
                    <PlayerIdentity
                      name={player.name}
                      tier={player.tier}
                      markSize={36}
                      nameClassName="text-2xl font-semibold tracking-tight"
                    />
                  </SheetTitle>
                  {showRank ? (
                    <SheetDescription>Rank {player.rank}</SheetDescription>
                  ) : (
                    <SheetDescription className="sr-only">
                      Career stats for a player who is not on the public leaderboard.
                    </SheetDescription>
                  )}
                </>
              )}
            </SheetHeader>

            <div
              ref={scrollRef}
              className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pb-6"
            >
              {selectedMatch ? (
                <MatchResults
                  match={selectedMatch}
                  focusedPlayerId={player.id}
                  playerById={playerById}
                />
              ) : (
                <>
                  <section className="space-y-2">
                    <h3 className="text-sm font-medium">Career</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <StatCell
                        label="Current ELO"
                        value={formatElo(player.elo)}
                      />
                      <StatCell
                        label="Peak ELO"
                        value={formatElo(player.peakElo ?? player.elo)}
                      />
                      <StatCell
                        label="W/L Record"
                        value={`${player.wins}–${player.losses}`}
                      />
                      <StatCell
                        label="Win %"
                        value={formatPercent(player.winRate)}
                      />
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
                        label="Peak kills"
                        value={
                          player.peakKills == null
                            ? "—"
                            : String(player.peakKills)
                        }
                      />
                      <StatCell
                        label="Avg bonus $/match"
                        value={formatBonus(
                          player.avgBonus ??
                            perStatsMatch(
                              player.totals.scoreboardBonus,
                              player.statsMatches,
                            ),
                        )}
                      />
                      <StatCell
                        label="Peak bonus $"
                        value={formatBonus(player.peakBonus)}
                      />
                      <StatCell
                        label="Avg bonus $/round"
                        value={formatBonus(player.avgBonusPerRound)}
                      />
                      <StatCell
                        label="FF $"
                        value={formatBonus(player.totals.friendlyFireTotal)}
                      />
                      <StatCell
                        label="Peak FF $"
                        value={formatBonus(player.peakFriendlyFire)}
                      />
                      <StatCell
                        label="Avg res"
                        value={formatStatAverage(
                          player.avgResurrects ??
                            perStatsMatch(
                              player.totals.resurrects,
                              player.statsMatches,
                            ),
                        )}
                      />
                    </div>
                  </section>

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

                            return (
                              <li key={match.id}>
                                <button
                                  type="button"
                                  onClick={() => openMatch(match.id)}
                                  className="w-full rounded-lg border border-border/60 px-3 py-2 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                  aria-label={`View results for ${match.map} ${match.mode}`}
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <span
                                      className={cn(
                                        "rounded-md px-1.5 py-0.5 text-xs font-semibold",
                                        won === true &&
                                          "bg-primary/15 text-primary",
                                        won === false &&
                                          "bg-destructive/15 text-destructive",
                                        won === null &&
                                          "bg-muted text-muted-foreground",
                                      )}
                                    >
                                      {won === true
                                        ? "W"
                                        : won === false
                                          ? "L"
                                          : "—"}
                                    </span>
                                    <EloChange
                                      change={eloChange}
                                      className="text-sm"
                                    />
                                  </div>
                                  <p className="mt-1 truncate text-sm">
                                    {match.map} · {match.mode}
                                  </p>
                                  <p className="text-xs tabular-nums text-muted-foreground">
                                    {formatPlayerMatchScore(match, player.id)} ·{" "}
                                    <LocalDateTime iso={match.finishedAt} />
                                  </p>
                                </button>
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
                </>
              )}
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
});
