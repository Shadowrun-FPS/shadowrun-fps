"use client";

import { memo } from "react";

import { PlayerIdentity } from "@/components/leaderboard/rank-tier-mark";
import { formatElo, formatKd, formatPercent } from "@/lib/leaderboard-stats";
import { cn } from "@/lib/utils";
import type { LeaderboardPlayer } from "@/types";

interface LeaderboardRowProps {
  player: LeaderboardPlayer;
  isHighlighted: boolean;
  onSelect: (playerId: string) => void;
}

export const LeaderboardRow = memo(function LeaderboardRow({
  player,
  isHighlighted,
  onSelect,
}: LeaderboardRowProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(player.id)}
      className={cn(
        "flex w-full min-h-11 items-center gap-3 rounded-xl border border-border/60 bg-card px-3 py-2.5 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:hidden",
        isHighlighted && "border-primary/40 bg-primary/10",
      )}
    >
      <span className="w-8 shrink-0 text-center text-sm font-semibold tabular-nums text-muted-foreground">
        {player.rank}
      </span>
      <span className="min-w-0 flex-1">
        <PlayerIdentity
          name={player.name}
          tier={player.tier}
          nameClassName="font-medium"
        />
        <span className="mt-0.5 block text-xs tabular-nums text-muted-foreground">
          {player.wins}–{player.losses} W/L
        </span>
      </span>
      <span className="shrink-0 text-right">
        <span className="block text-sm font-semibold tabular-nums">
          {formatElo(player.elo)} Elo
        </span>
        <span className="text-xs tabular-nums text-muted-foreground">
          {formatPercent(player.winRate)} WR · {formatKd(player.kd)} K/D
        </span>
      </span>
    </button>
  );
});
