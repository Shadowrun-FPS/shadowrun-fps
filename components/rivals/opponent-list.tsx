"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { PlayerIdentity } from "@/components/leaderboard/rank-tier-mark";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatMatchDateTime } from "@/lib/match-date";
import { rivalryHref } from "@/lib/rivals/links";
import { formatSeriesScore, playerName } from "@/lib/rivals/pairs";
import { tableBadge } from "@/lib/rivals/rank";
import { cn } from "@/lib/utils";
import type { FeaturedSet, OpponentSummary, RivalIndex, SeriesStreak } from "@/types/rivals";

type SortKey = "meetings" | "recent" | "record";

const OPPONENT_PAGE_SIZE = 8;

const BADGE_LABEL = {
  main: "Main Rival",
  nemesis: "Nemesis",
  emerging: "Emerging",
  established: "Established",
} as const;

function streakLabel(streak: SeriesStreak): string {
  if (streak.kind === "none" || streak.length < 1) return "—";
  const name = streak.kind === "win" ? "W" : "L";
  return `${streak.length}${name}`;
}

function compareOpponents(
  left: OpponentSummary,
  right: OpponentSummary,
  key: SortKey,
  direction: "asc" | "desc",
  index: RivalIndex,
): number {
  const sign = direction === "asc" ? 1 : -1;
  if (key === "meetings" && left.lifetime.meetings !== right.lifetime.meetings) {
    return (left.lifetime.meetings - right.lifetime.meetings) * sign;
  }
  if (key === "recent" && left.lifetime.newestMs !== right.lifetime.newestMs) {
    return (left.lifetime.newestMs - right.lifetime.newestMs) * sign;
  }
  if (key === "record") {
    const leftDiff = left.lifetime.wins - left.lifetime.losses;
    const rightDiff = right.lifetime.wins - right.lifetime.losses;
    if (leftDiff !== rightDiff) return (leftDiff - rightDiff) * sign;
    if (left.lifetime.wins !== right.lifetime.wins) {
      return (left.lifetime.wins - right.lifetime.wins) * sign;
    }
  }
  return playerName(index, left.opponentId).localeCompare(playerName(index, right.opponentId));
}

function OpponentBadge({
  summary,
  featured,
}: {
  summary: OpponentSummary;
  featured: FeaturedSet;
}) {
  const badge = tableBadge(summary, featured);
  if (!badge && !summary.quietLately) return <span className="text-muted-foreground">—</span>;
  return (
    <span className="flex flex-wrap items-center gap-1">
      {badge ? (
        <Badge variant={badge === "nemesis" ? "destructive" : "secondary"}>
          {BADGE_LABEL[badge]}
        </Badge>
      ) : null}
      {summary.quietLately ? (
        <span className="text-xs text-muted-foreground">Quiet lately</span>
      ) : null}
    </span>
  );
}

export function OpponentList({
  index,
  viewerId,
  opponents,
  featured,
}: {
  index: RivalIndex;
  viewerId: string;
  opponents: OpponentSummary[];
  featured: FeaturedSet;
}) {
  const [sortKey, setSortKey] = useState<SortKey>("meetings");
  const [direction, setDirection] = useState<"asc" | "desc">("desc");
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(false);

  const sorted = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const ranked = [...opponents].sort((left, right) =>
      compareOpponents(left, right, sortKey, direction, index),
    );
    if (!needle) return ranked;
    return ranked.filter((summary) =>
      playerName(index, summary.opponentId).toLowerCase().includes(needle),
    );
  }, [direction, index, opponents, query, sortKey]);

  const visible = expanded ? sorted : sorted.slice(0, OPPONENT_PAGE_SIZE);
  const hiddenCount = sorted.length - visible.length;

  const chooseSort = (key: SortKey) => {
    if (sortKey === key) {
      setDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setDirection("desc");
  };

  if (sorted.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
        No recorded opposing-team meetings for this player.
      </p>
    );
  }

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Opponents</h2>
          <p className="text-sm text-muted-foreground">
            Your record is wins–losses from {playerName(index, viewerId)}&apos;s side.
          </p>
        </div>
        <div className="flex flex-wrap gap-1">
          {(
            [
              ["meetings", "Meetings"],
              ["recent", "Latest"],
              ["record", "Your record"],
            ] as const
          ).map(([key, label]) => (
            <Button
              key={key}
              type="button"
              size="sm"
              variant={sortKey === key ? "secondary" : "outline"}
              onClick={() => chooseSort(key)}
              aria-pressed={sortKey === key}
            >
              {label}
              {sortKey === key ? (direction === "desc" ? " ↓" : " ↑") : ""}
            </Button>
          ))}
        </div>
      </div>

      <Input
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setExpanded(false);
        }}
        placeholder="Find an opponent"
        aria-label="Find an opponent"
        maxLength={64}
      />

      {sorted.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
          No opponents match that name.
        </p>
      ) : null}

      {sorted.length > 0 ? (
      <ul className="space-y-2 md:hidden">
        {visible.map((summary) => (
          <li key={summary.pairKey} className="rounded-xl border border-border/60 bg-card p-3">
            <OpponentBody
              index={index}
              viewerId={viewerId}
              summary={summary}
              featured={featured}
            />
          </li>
        ))}
      </ul>
      ) : null}

      {sorted.length > 0 ? (
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[40rem] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="px-2 py-2 font-medium">Opponent</th>
              <th className="px-2 py-2 font-medium">Meetings</th>
              <th className="px-2 py-2 font-medium">Your record</th>
              <th className="px-2 py-2 font-medium">Streak</th>
              <th className="px-2 py-2 font-medium">Latest</th>
              <th className="px-2 py-2 font-medium">Relationship</th>
              <th className="px-2 py-2 font-medium">
                <span className="sr-only">Details</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {visible.map((summary) => {
              const opponent = index.players.get(summary.opponentId);
              return (
                <tr key={summary.pairKey} className="border-b border-border/40">
                  <td className="px-2 py-3">
                    <PlayerIdentity name={opponent?.name ?? "Unknown"} tier={opponent?.tier} />
                  </td>
                  <td className="px-2 py-3 tabular-nums">{summary.lifetime.meetings}</td>
                  <td className="px-2 py-3 tabular-nums">
                    {formatSeriesScore(summary.lifetime.wins, summary.lifetime.losses)}
                  </td>
                  <td className="px-2 py-3 tabular-nums">{streakLabel(summary.streak)}</td>
                  <td className="px-2 py-3">
                    {summary.lifetime.lastFinishedAt
                      ? formatMatchDateTime(summary.lifetime.lastFinishedAt)
                      : "—"}
                  </td>
                  <td className="px-2 py-3">
                    <OpponentBadge summary={summary} featured={featured} />
                  </td>
                  <td className="px-2 py-3 text-right">
                    <Link
                      href={rivalryHref(summary.pairKey, viewerId)}
                      className={cn("font-medium text-primary underline-offset-4 hover:underline")}
                    >
                      Details
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      ) : null}

      {hiddenCount > 0 ? (
        <Button type="button" variant="outline" onClick={() => setExpanded(true)}>
          Show {hiddenCount} more
        </Button>
      ) : null}
      {expanded && sorted.length > OPPONENT_PAGE_SIZE ? (
        <Button type="button" variant="ghost" onClick={() => setExpanded(false)}>
          Show less
        </Button>
      ) : null}
    </section>
  );
}

function OpponentBody({
  index,
  viewerId,
  summary,
  featured,
}: {
  index: RivalIndex;
  viewerId: string;
  summary: OpponentSummary;
  featured: FeaturedSet;
}) {
  const opponent = index.players.get(summary.opponentId);
  return (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-2">
        <PlayerIdentity name={opponent?.name ?? "Unknown"} tier={opponent?.tier} />
        <p className="text-lg font-semibold tabular-nums">
          {formatSeriesScore(summary.lifetime.wins, summary.lifetime.losses)}
        </p>
      </div>
      <p className="text-sm text-muted-foreground">
        {summary.lifetime.meetings} recorded meetings · Streak {streakLabel(summary.streak)}
      </p>
      <p className="text-sm text-muted-foreground">
        {summary.lifetime.lastFinishedAt
          ? `Latest ${formatMatchDateTime(summary.lifetime.lastFinishedAt)}`
          : "No dated meeting"}
      </p>
      <div className="flex items-center justify-between gap-2">
        <OpponentBadge summary={summary} featured={featured} />
        <Link
          href={rivalryHref(summary.pairKey, viewerId)}
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Details
        </Link>
      </div>
    </div>
  );
}
