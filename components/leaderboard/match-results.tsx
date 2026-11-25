"use client";

import { memo } from "react";

import { EloChange } from "@/components/leaderboard/elo-change";
import { PlayerIdentity } from "@/components/leaderboard/rank-tier-mark";
import {
  RANKED_TEAM_LABELS,
  formatBonus,
  formatPercent,
  getOpposingTeam,
  getPlayerTeam,
  matchPlayerAccuracy,
  sortMatchRoster,
} from "@/lib/leaderboard-stats";
import { cn } from "@/lib/utils";
import type {
  LeaderboardMatch,
  LeaderboardMatchPlayer,
  LeaderboardPlayer,
  RankedTeamId,
} from "@/types";

const TEAM_PANEL_CLASSES: Record<RankedTeamId, string> = {
  0: "border-team-blue/40 bg-team-blue/10",
  1: "border-team-red/40 bg-team-red/10",
};

const TEAM_SCORE_CLASSES: Record<RankedTeamId, string> = {
  0: "text-team-blue",
  1: "text-team-red",
};

interface MatchResultsProps {
  match: LeaderboardMatch;
  focusedPlayerId?: string;
  playerById: Map<string, LeaderboardPlayer>;
}

interface MatchTeamPanelProps {
  team: RankedTeamId;
  score: number;
  won: boolean;
  isFocusedTeam: boolean;
  showPerspective: boolean;
  players: LeaderboardMatchPlayer[];
  focusedPlayerId?: string;
  playerById: Map<string, LeaderboardPlayer>;
}

const MatchPlayerRow = memo(function MatchPlayerRow({
  player,
  focused,
  standing,
}: {
  player: LeaderboardMatchPlayer;
  focused: boolean;
  standing: LeaderboardPlayer | undefined;
}) {
  const stats = player.stats;

  return (
    <li
      className={cn(
        "rounded-md px-2.5 py-2",
        focused && "ring-1 ring-primary/70 bg-primary/10",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <PlayerIdentity
          name={player.name}
          tier={standing?.tier}
          markSize={20}
          nameClassName="text-sm font-medium"
        />
        <EloChange change={player.eloChange} className="text-sm" />
      </div>
      {stats ? (
        <p className="mt-1 text-xs tabular-nums text-muted-foreground">
          {stats.kills} K · {stats.deaths} D · {stats.resurrects} res ·{" "}
          {formatPercent(matchPlayerAccuracy(player))} acc ·{" "}
          {formatBonus(stats.scoreboardBonus)}
        </p>
      ) : (
        <p className="mt-1 text-xs text-muted-foreground">No end-game stats</p>
      )}
    </li>
  );
});

const MatchTeamPanel = memo(function MatchTeamPanel({
  team,
  score,
  won,
  isFocusedTeam,
  showPerspective,
  players,
  focusedPlayerId,
  playerById,
}: MatchTeamPanelProps) {
  const roster = sortMatchRoster(players, focusedPlayerId);

  return (
    <section
      className={cn("rounded-lg border px-3 py-3", TEAM_PANEL_CLASSES[team])}
    >
      <header className="mb-2 flex items-center justify-between gap-2">
        <h4 className="flex min-w-0 flex-wrap items-center gap-2 text-sm font-semibold">
          <span className="min-w-0">{RANKED_TEAM_LABELS[team]}</span>
          {won ? (
            <span className="rounded-md bg-primary/15 px-1.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-primary">
              Won
            </span>
          ) : showPerspective && isFocusedTeam ? (
            <span className="rounded-md bg-destructive/15 px-1.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-destructive">
              Lost
            </span>
          ) : null}
          {showPerspective && isFocusedTeam ? (
            <span className="text-xs font-medium text-muted-foreground">
              Your team
            </span>
          ) : null}
        </h4>
        <p
          className={cn(
            "text-lg font-semibold tabular-nums",
            TEAM_SCORE_CLASSES[team],
          )}
        >
          {score}
        </p>
      </header>
      {roster.length === 0 ? (
        <p className="text-sm text-muted-foreground">No players recorded.</p>
      ) : (
        <ul className="space-y-1">
          {roster.map((player) => (
            <MatchPlayerRow
              key={player.id}
              player={player}
              focused={player.id === focusedPlayerId}
              standing={playerById.get(player.id)}
            />
          ))}
        </ul>
      )}
    </section>
  );
});

export const MatchResults = memo(function MatchResults({
  match,
  focusedPlayerId,
  playerById,
}: MatchResultsProps) {
  const winner = match.winningTeam;
  const focusedTeam = focusedPlayerId
    ? getPlayerTeam(match, focusedPlayerId)
    : null;
  const leftTeam = focusedTeam ?? winner;
  const rightTeam = getOpposingTeam(leftTeam);
  const leftWon = leftTeam === winner;
  const showPerspective = focusedTeam != null;

  return (
    <div className="space-y-4">
      <div className="text-center">
        <p className="flex items-baseline justify-center gap-3 text-3xl font-semibold tabular-nums tracking-tight">
          <span className={TEAM_SCORE_CLASSES[leftTeam]}>
            {match.score[leftTeam]}
          </span>
          <span className="text-xl font-medium text-muted-foreground">–</span>
          <span className={TEAM_SCORE_CLASSES[rightTeam]}>
            {match.score[rightTeam]}
          </span>
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {showPerspective
            ? leftWon
              ? "Your team won · first to 6"
              : "Your team lost · first to 6"
            : `${RANKED_TEAM_LABELS[winner]} won · first to 6`}
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <MatchTeamPanel
          team={leftTeam}
          score={match.score[leftTeam]}
          won={leftWon}
          isFocusedTeam={focusedTeam === leftTeam}
          showPerspective={showPerspective}
          players={match.players.filter((player) => player.team === leftTeam)}
          focusedPlayerId={focusedPlayerId}
          playerById={playerById}
        />
        <MatchTeamPanel
          team={rightTeam}
          score={match.score[rightTeam]}
          won={!leftWon}
          isFocusedTeam={false}
          showPerspective={showPerspective}
          players={match.players.filter((player) => player.team === rightTeam)}
          focusedPlayerId={focusedPlayerId}
          playerById={playerById}
        />
      </div>
    </div>
  );
});
