"use client";

import { memo } from "react";

import { PlayerIdentity } from "@/components/leaderboard/rank-tier-mark";
import { namesMatch } from "@/lib/leaderboard-stats";
import { cn } from "@/lib/utils";
import type {
  LeaderboardHighlight,
  LeaderboardHighlightScope,
} from "@/types";

const HIGHLIGHT_SURFACE: Record<LeaderboardHighlight["id"], string> = {
  most_improved: "border-primary/50 bg-primary/10",
  peak_elo: "border-primary/50 bg-primary/10",
  most_games: "border-border bg-muted/40",
  peak_kills: "border-border bg-tertiary/30",
  peak_bonus: "border-border bg-tertiary/30",
  avg_bonus: "border-border bg-tertiary/30",
  highest_kd: "border-border bg-tertiary/30",
  most_resurrects: "border-border bg-muted/40",
  best_win_rate: "border-border bg-tertiary/30",
};

const SCOPE_OPTIONS: {
  id: LeaderboardHighlightScope;
  label: string;
}[] = [
  { id: "season", label: "Last 30 days" },
  { id: "career", label: "Career" },
];

interface LeaderboardPodiumProps {
  highlights: LeaderboardHighlight[];
  scope: LeaderboardHighlightScope;
  onScopeChange: (scope: LeaderboardHighlightScope) => void;
  onSelectPlayer: (playerId: string) => void;
  highlightedName?: string | null;
}

/** Highlight cards above the standings, with season/career scope toggle. */
export const LeaderboardPodium = memo(function LeaderboardPodium({
  highlights,
  scope,
  onScopeChange,
  onSelectPlayer,
  highlightedName,
}: LeaderboardPodiumProps) {
  return (
    <section className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Highlights
        </p>
        <div
          role="group"
          aria-label="Highlight time range"
          className="inline-flex rounded-lg border border-border/70 bg-background/60 p-0.5"
        >
          {SCOPE_OPTIONS.map((option) => {
            const isActive = scope === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => onScopeChange(option.id)}
                aria-pressed={isActive}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isActive
                    ? "bg-primary/15 text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {highlights.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
          {scope === "season"
            ? "No last-30-day highlights yet."
            : "No career highlights yet."}
        </p>
      ) : (
        <ol className="grid grid-cols-1 items-stretch gap-2 md:grid-cols-3">
          {highlights.map((highlight) => {
            const isHighlighted = namesMatch(
              highlight.player.name,
              highlightedName,
            );

            return (
              <li key={`${scope}-${highlight.id}`} className="min-w-0">
                <button
                  type="button"
                  onClick={() => onSelectPlayer(highlight.player.id)}
                  className={cn(
                    "flex h-full min-h-[5.75rem] w-full flex-col gap-1 rounded-xl border px-4 py-3 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    HIGHLIGHT_SURFACE[highlight.id],
                    isHighlighted && "ring-2 ring-primary/40",
                  )}
                >
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {highlight.label}
                  </span>
                  <PlayerIdentity
                    name={highlight.player.name}
                    tier={highlight.player.tier}
                    markSize={32}
                    nameClassName="text-lg font-semibold tracking-tight"
                  />
                  <span
                    className={cn(
                      "mt-auto flex min-h-[1.25rem] items-baseline gap-x-2 tabular-nums",
                      highlight.id === "most_improved" ||
                        highlight.id === "peak_elo"
                        ? "justify-between"
                        : "justify-end text-right",
                    )}
                  >
                    {(highlight.id === "most_improved" ||
                      highlight.id === "peak_elo") &&
                    highlight.detail ? (
                      <span className="text-xs text-muted-foreground">
                        {highlight.detail}
                      </span>
                    ) : null}
                    <span
                      className={cn(
                        "text-sm font-semibold text-foreground md:text-base",
                        (highlight.id === "most_improved" ||
                          highlight.id === "peak_elo") &&
                          !highlight.detail &&
                          "ml-auto",
                      )}
                    >
                      {highlight.value}
                    </span>
                    {highlight.id !== "most_improved" &&
                    highlight.id !== "peak_elo" &&
                    highlight.detail ? (
                      <span className="text-xs text-muted-foreground">
                        {highlight.detail}
                      </span>
                    ) : null}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
});
