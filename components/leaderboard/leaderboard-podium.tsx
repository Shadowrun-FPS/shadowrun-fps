"use client";

import { memo } from "react";

import { PlayerIdentity } from "@/components/leaderboard/rank-tier-mark";
import { formatElo, formatPercent, namesMatch } from "@/lib/leaderboard-stats";
import { cn } from "@/lib/utils";
import type { LeaderboardPlayer } from "@/types";

const PODIUM_SURFACE: Record<number, string> = {
  0: "border-primary/50 bg-primary/10 md:order-2 md:-mt-2",
  1: "border-border bg-muted/40 md:order-1",
  2: "border-border bg-tertiary/30 md:order-3",
};

interface LeaderboardPodiumProps {
  players: LeaderboardPlayer[];
  onSelectPlayer: (playerId: string) => void;
  highlightedName?: string | null;
}

export const LeaderboardPodium = memo(function LeaderboardPodium({
  players,
  onSelectPlayer,
  highlightedName,
}: LeaderboardPodiumProps) {
  if (players.length === 0) return null;

  return (
    <ol className="grid grid-cols-1 gap-2 md:grid-cols-3 md:items-end">
      {players.map((player) => {
        const placement = Math.min(Math.max(player.rank - 1, 0), 2);
        const isHighlighted = namesMatch(player.name, highlightedName);

        return (
          <li key={player.id} className="min-w-0">
            <button
              type="button"
              onClick={() => onSelectPlayer(player.id)}
              className={cn(
                "flex w-full min-h-[4.5rem] flex-col items-start gap-1 rounded-xl border px-4 py-3 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                PODIUM_SURFACE[placement] ?? PODIUM_SURFACE[1],
                isHighlighted && "ring-2 ring-primary/40",
              )}
            >
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Rank {player.rank}
              </span>
              <PlayerIdentity
                name={player.name}
                tier={player.tier}
                markSize={32}
                nameClassName="text-lg font-semibold tracking-tight"
              />
              <span className="text-sm tabular-nums text-muted-foreground">
                {formatElo(player.elo)} Elo · {player.wins}–{player.losses} ·{" "}
                {formatPercent(player.winRate)}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
});
