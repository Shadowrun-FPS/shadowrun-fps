import Link from "next/link";
import { Pin } from "lucide-react";

import { ResultPips } from "@/components/rivals/result-pips";
import { PlayerIdentity } from "@/components/leaderboard/rank-tier-mark";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatMatchDateTime } from "@/lib/match-date";
import { rivalryHref } from "@/lib/rivals/links";
import { formatSeriesScore, playerName } from "@/lib/rivals/pairs";
import type { FeaturedRival, RivalIndex, SeriesStreak } from "@/types/rivals";

const BADGE_TEXT = {
  main: "Main Rival",
  nemesis: "Nemesis",
  emerging: "Emerging",
} as const;

function streakText(streak: SeriesStreak): string {
  if (streak.kind === "none" || streak.length < 1) return "No current streak";
  const label = streak.kind === "win" ? "win" : "loss";
  return `${streak.length}-match ${label} streak`;
}

export function RivalCard({
  heading,
  featured,
  emptyText,
  note,
  index,
  viewerId,
  pinned,
  onTogglePin,
  viewerImage,
}: {
  heading: string;
  featured: FeaturedRival | null;
  emptyText: string;
  note?: string | null;
  index: RivalIndex;
  viewerId: string;
  pinned: boolean;
  onTogglePin?: (pairKey: string) => void;
  viewerImage?: string | null;
}) {
  const opponent = featured ? index.players.get(featured.opponentId) : null;

  return (
    <article className="flex h-full flex-col rounded-xl border border-border/60 bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {heading}
        </h2>
        {featured ? (
          <div className="flex flex-wrap justify-end gap-1">
            {featured.badges.map((badge) => (
              <Badge key={badge} variant={badge === "nemesis" ? "destructive" : "secondary"}>
                {BADGE_TEXT[badge]}
              </Badge>
            ))}
          </div>
        ) : null}
      </div>

      {featured && opponent ? (
        <>
          <div className="mt-3 flex items-center justify-between gap-3">
            <PlayerIdentity
              name={opponent.name}
              tier={opponent.tier}
              nameClassName="text-base font-semibold"
            />
            <p className="text-2xl font-semibold tabular-nums tracking-tight">
              <span className="sr-only">
                Your record, {featured.recent.wins} {featured.recent.wins === 1 ? "win" : "wins"} and{" "}
                {featured.recent.losses} {featured.recent.losses === 1 ? "loss" : "losses"}.{" "}
              </span>
              <span aria-hidden="true">
                {formatSeriesScore(featured.recent.wins, featured.recent.losses)}
              </span>
            </p>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {featured.recent.meetings} meetings in the last 30 days
            {featured.recent.lastFinishedAt
              ? ` · Last meeting ${formatMatchDateTime(featured.recent.lastFinishedAt)}`
              : ""}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">{streakText(featured.streak)}</p>
          <ResultPips results={featured.recent.lastFive} className="mt-3" />
          <p className="mt-3 text-sm leading-relaxed">{featured.explanation}</p>
          {featured.mutualMain ? (
            <p className="mt-2 text-sm font-medium">You are each other’s Main Rival.</p>
          ) : null}
          {viewerImage ? (
            <span className="sr-only">Signed-in Discord avatar is shown on your own player chip.</span>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild size="sm">
              <Link href={rivalryHref(featured.pairKey, viewerId)}>View rivalry</Link>
            </Button>
            {onTogglePin ? (
              <Button
                type="button"
                size="sm"
                variant={pinned ? "secondary" : "outline"}
                onClick={() => onTogglePin(featured.pairKey)}
                aria-pressed={pinned}
              >
                <Pin aria-hidden="true" />
                {pinned ? "Pinned" : "Pin"}
              </Button>
            ) : null}
          </div>
        </>
      ) : (
        <div className="mt-3 space-y-2">
          <p className="text-lg font-semibold tracking-tight">
            {heading === "Main Rival" ? "Rivalries developing" : "None yet"}
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">{emptyText}</p>
        </div>
      )}
      {note ? <p className="mt-3 text-sm text-muted-foreground">{note}</p> : null}
      <span className="sr-only">{playerName(index, viewerId)}</span>
    </article>
  );
}

export function ViewerChip({
  name,
  image,
}: {
  name: string;
  image?: string | null;
}) {
  if (!image) return null;
  return (
    <Avatar className="h-8 w-8">
      <AvatarImage src={image} alt="" />
      <AvatarFallback>{name.slice(0, 1)}</AvatarFallback>
    </Avatar>
  );
}
