"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Link2, Pin } from "lucide-react";

import { SeriesSummary } from "@/components/rivals/series-summary";
import { useRivalsPreference } from "@/components/rivals/use-rivals-preference";
import { PlayerIdentity } from "@/components/leaderboard/rank-tier-mark";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { rivalryHref, rivalsOverviewHref } from "@/lib/rivals/links";
import { playerName, rivalIndexFromPayload } from "@/lib/rivals/pairs";
import type { LeaderboardPayload } from "@/types";

export function RivalryDetail({
  data,
  pairKey,
  playerIds,
  initialPlayerId,
}: {
  data: LeaderboardPayload;
  pairKey: string;
  playerIds: [string, string];
  initialPlayerId: string | null;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const index = useMemo(() => rivalIndexFromPayload(data), [data]);
  const roster = useMemo(
    () => [...data.players, ...(data.unlistedPlayers ?? [])],
    [data.players, data.unlistedPlayers],
  );
  const prefs = useRivalsPreference(roster, initialPlayerId);
  const stored = prefs.preference.selectedPlayerId;
  const starting =
    initialPlayerId && playerIds.includes(initialPlayerId)
      ? initialPlayerId
      : stored && playerIds.includes(stored)
        ? stored
        : playerIds[0];
  const [perspective, setPerspective] = useState(starting);
  const viewerId = playerIds.includes(perspective) ? perspective : playerIds[0];
  const pinned = prefs.preference.pinnedPairKeys.includes(pairKey);

  const choosePerspective = (playerId: string) => {
    setPerspective(playerId);
    router.replace(rivalryHref(pairKey, playerId), { scroll: false });
  };

  const copyLink = async () => {
    const url = `${window.location.origin}${rivalryHref(pairKey, viewerId)}`;
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copied" });
    } catch {
      toast({ title: "Could not copy the link", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link
          href={rivalsOverviewHref(viewerId)}
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          All rivals
        </Link>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => void copyLink()}>
            <Link2 aria-hidden="true" />
            Copy link
          </Button>
          <Button
            type="button"
            size="sm"
            variant={pinned ? "secondary" : "outline"}
            aria-pressed={pinned}
            onClick={() => prefs.togglePin(pairKey)}
          >
            <Pin aria-hidden="true" />
            {pinned ? "Pinned" : "Pin"}
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {[playerIds[0], playerIds[1]].map((playerId) => {
          const player = index.players.get(playerId);
          return (
            <Link key={playerId} href={`/leaderboard?player=${playerId}`} className="min-w-0">
              <PlayerIdentity
                name={player?.name ?? playerName(index, playerId)}
                tier={player?.tier}
                nameClassName="text-lg font-semibold"
              />
            </Link>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Series perspective">
        {playerIds.map((playerId) => (
          <Button
            key={playerId}
            type="button"
            size="sm"
            variant={viewerId === playerId ? "secondary" : "outline"}
            aria-pressed={viewerId === playerId}
            onClick={() => choosePerspective(playerId)}
          >
            As {playerName(index, playerId)}
          </Button>
        ))}
      </div>

      <p className="text-sm text-muted-foreground">
        The same rivalry, read from {playerName(index, viewerId)}&apos;s side. Last 30 days and
        recorded history are labeled separately. The snapshot may not include every past match.
      </p>

      <SeriesSummary index={index} viewerId={viewerId} pairKey={pairKey} detailed />
    </div>
  );
}
