"use client";

import { memo } from "react";

import { PlayerIdentity } from "@/components/leaderboard/rank-tier-mark";
import { RANKED_TEAM_LABELS, getRankTier } from "@/lib/leaderboard-stats";
import type { MatchScoreboardPlayer } from "@/types";

interface ScoreboardPlayerNameProps {
  player: MatchScoreboardPlayer;
  onSelectPlayer?: (playerId: string) => void;
}

/** Rank icon + name for a scoreboard seat. Optional click opens the player sheet. */
export const ScoreboardPlayerName = memo(function ScoreboardPlayerName({
  player,
  onSelectPlayer,
}: ScoreboardPlayerNameProps) {
  const tier = player.elo == null ? undefined : getRankTier(player.elo);
  const teamLabel = (
    <span className="sr-only">({RANKED_TEAM_LABELS[player.team]})</span>
  );

  if (!onSelectPlayer) {
    return (
      <>
        <PlayerIdentity name={player.name} tier={tier} markSize={20} />
        {teamLabel}
      </>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onSelectPlayer(player.id)}
      className="rounded-sm text-left underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label={`View ${player.name} stats`}
    >
      <PlayerIdentity name={player.name} tier={tier} markSize={20} />
      {teamLabel}
    </button>
  );
});
