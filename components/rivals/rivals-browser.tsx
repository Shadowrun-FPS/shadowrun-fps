"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

import { OpponentList } from "@/components/rivals/opponent-list";
import { RivalCard, ViewerChip } from "@/components/rivals/rival-card";
import { SeriesSummary } from "@/components/rivals/series-summary";
import { useRivalsPreference } from "@/components/rivals/use-rivals-preference";
import { PlayerNameSearch } from "@/components/leaderboard/player-name-search";
import { PlayerIdentity } from "@/components/leaderboard/rank-tier-mark";
import { Button } from "@/components/ui/button";
import { LocalDateTime } from "@/components/local-date-time";
import { MAX_VISIBLE_UPDATES } from "@/lib/rivals/config";
import { rivalsOverviewHref, rivalryHref } from "@/lib/rivals/links";
import { playerName, rivalIndexFromPayload } from "@/lib/rivals/pairs";
import { opponentSummaries, selectFeatured } from "@/lib/rivals/rank";
import { advanceSeen, captureSeen, updatesSinceLastSeen } from "@/lib/rivals/updates";
import { cn } from "@/lib/utils";
import type { LeaderboardPayload, RivalUpdate } from "@/types";

function UpdateList({
  firstVisit,
  items,
  viewerId,
}: {
  firstVisit: boolean;
  items: RivalUpdate[];
  viewerId: string;
}) {
  const visible = items.slice(0, MAX_VISIBLE_UPDATES);
  return (
    <section className="space-y-2" aria-live="polite">
      <h2 className="text-lg font-semibold tracking-tight">
        {firstVisit ? "Recent highlights" : "Since your last visit"}
      </h2>
      {firstVisit ? (
        <p className="text-sm text-muted-foreground">
          Highlights from the recorded history. These are not marked as unseen.
        </p>
      ) : null}
      {visible.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing new in the recorded meetings.</p>
      ) : (
        <ul className="space-y-2">
          {visible.map((item) => (
            <li key={item.id} className="rounded-lg border border-border/60 px-3 py-2 text-sm">
              {item.pairKey ? (
                <Link href={rivalryHref(item.pairKey, viewerId)} className="hover:underline">
                  {item.text}
                </Link>
              ) : (
                item.text
              )}
            </li>
          ))}
        </ul>
      )}
      {items.length > visible.length ? (
        <p className="text-xs text-muted-foreground">
          Showing {visible.length} of {items.length}. The rest stays until you come back.
        </p>
      ) : null}
    </section>
  );
}

export function RivalsBrowser({
  data,
  initialPlayerId,
  onRefresh,
  isRefreshing,
}: {
  data: LeaderboardPayload;
  initialPlayerId: string | null;
  onRefresh: () => void;
  isRefreshing: boolean;
}) {
  const router = useRouter();
  const index = useMemo(() => rivalIndexFromPayload(data), [data]);
  const roster = useMemo(
    () => [...data.players, ...(data.unlistedPlayers ?? [])],
    [data.players, data.unlistedPlayers],
  );
  const prefs = useRivalsPreference(roster, initialPlayerId);
  const rememberSeen = prefs.rememberSeen;
  const [query, setQuery] = useState("");
  const replacedUrl = useRef(false);
  const viewerId = prefs.preference.selectedPlayerId;
  const viewer = viewerId ? index.players.get(viewerId) : null;
  const hydrated = prefs.hydrated;
  const baseline = viewerId && hydrated ? prefs.baselineFor(viewerId) : undefined;

  const summaries = useMemo(
    () => (viewerId ? opponentSummaries(index, viewerId) : []),
    [index, viewerId],
  );
  const featured = useMemo(
    () => (viewerId ? selectFeatured(index, viewerId) : null),
    [index, viewerId],
  );
  const updates = useMemo(() => {
    if (!viewerId || baseline === undefined || !featured) return null;
    return updatesSinceLastSeen(index, viewerId, baseline, featured.main?.opponentId ?? null);
  }, [baseline, featured, index, viewerId]);

  useEffect(() => {
    if (!hydrated || !viewerId || replacedUrl.current) return;
    replacedUrl.current = true;
    if (viewerId !== initialPlayerId) {
      router.replace(rivalsOverviewHref(viewerId), { scroll: false });
    }
  }, [hydrated, initialPlayerId, router, viewerId]);

  useEffect(() => {
    if (!viewerId || !hydrated || !featured || !updates || baseline === undefined) return;
    const current = captureSeen(index, viewerId, featured.main?.opponentId ?? null);
    const next = advanceSeen(
      baseline,
      current,
      updates.items.slice(0, MAX_VISIBLE_UPDATES),
    );
    rememberSeen(viewerId, next);
  }, [baseline, featured, hydrated, index, rememberSeen, updates, viewerId]);

  const selectPlayer = (playerId: string) => {
    prefs.setSelectedPlayerId(playerId);
    router.replace(rivalsOverviewHref(playerId), { scroll: false });
  };

  const featuredPair = featured?.main?.pairKey ?? featured?.emerging?.pairKey ?? null;
  const pinned = summaries.filter((summary) =>
    prefs.preference.pinnedPairKeys.includes(summary.pairKey),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Updated <LocalDateTime iso={data.updatedAt} />
        </p>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/leaderboard">Leaderboard</Link>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={cn(isRefreshing && "animate-spin")} aria-hidden="true" />
            Refresh
          </Button>
        </div>
      </div>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          {viewer && prefs.viewerImage ? <ViewerChip name={viewer.name} image={prefs.viewerImage} /> : null}
          <div className="min-w-0 flex-1">
            <PlayerNameSearch
              id="rivals-player"
              value={query}
              onChange={setQuery}
              players={roster}
              onSelectPlayer={selectPlayer}
              placeholder="Choose a player"
              aria-label="Choose a player to view rivalries"
            />
          </div>
        </div>
        {viewer ? (
          <p className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-muted-foreground">Viewing</span>
            <Link
              href={`/leaderboard?player=${viewer.id}`}
              className="min-w-0 underline-offset-4 hover:underline"
            >
              <PlayerIdentity name={viewer.name} tier={viewer.tier} />
            </Link>
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Choose a player to see who they keep running into. The choice is saved on this browser.
          </p>
        )}
        {prefs.discordMatched ? (
          <p className="text-sm text-muted-foreground">
            Matched your Discord server nickname or username to this player. This does not verify
            that the account owns the player.
          </p>
        ) : null}
        <p className="text-sm text-muted-foreground">
          Featured rivals use meetings from the last 30 days. Series records below also keep the
          full snapshot, which may not be a complete career. Records are opposing-team results, and
          teammates share the same result.
        </p>
      </section>

      {!viewerId || !featured ? null : (
        <>
          <div className="grid gap-3 lg:grid-cols-3">
            <RivalCard
              heading="Main Rival"
              featured={featured.main}
              emptyText="No opponent has 5 meetings in the last 30 days, so there is no Main Rival yet."
              index={index}
              viewerId={viewerId}
              pinned={featured.main ? prefs.preference.pinnedPairKeys.includes(featured.main.pairKey) : false}
              onTogglePin={prefs.togglePin}
            />
            <RivalCard
              heading="Nemesis"
              featured={featured.nemesis}
              emptyText="A nemesis needs at least 5 meetings in the last 30 days and a win rate of 30% or lower."
              note={featured.nemesisNote}
              index={index}
              viewerId={viewerId}
              pinned={featured.nemesis ? prefs.preference.pinnedPairKeys.includes(featured.nemesis.pairKey) : false}
              onTogglePin={prefs.togglePin}
            />
            <RivalCard
              heading="Emerging Rival"
              featured={featured.emerging}
              emptyText="No opponent has 3 or 4 meetings in the last 30 days."
              note={featured.emergingNote}
              index={index}
              viewerId={viewerId}
              pinned={featured.emerging ? prefs.preference.pinnedPairKeys.includes(featured.emerging.pairKey) : false}
              onTogglePin={prefs.togglePin}
            />
          </div>

          {updates ? (
            <UpdateList firstVisit={updates.firstVisit} items={updates.items} viewerId={viewerId} />
          ) : null}

          {pinned.length > 0 ? (
            <section className="space-y-2">
              <h2 className="text-lg font-semibold tracking-tight">Pinned</h2>
              <ul className="space-y-2">
                {pinned.map((summary) => (
                  <li key={summary.pairKey}>
                    <Link
                      href={rivalryHref(summary.pairKey, viewerId)}
                      className="flex items-center justify-between gap-3 rounded-lg border border-border/60 px-3 py-2 text-sm hover:bg-muted/40"
                    >
                      <span>{playerName(index, summary.opponentId)}</span>
                      <span className="tabular-nums">
                        {summary.lifetime.wins}–{summary.lifetime.losses}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {featuredPair ? (
            <section className="space-y-3 rounded-xl border border-border/60 bg-card p-4">
              <h2 className="text-lg font-semibold tracking-tight">Featured series</h2>
              <SeriesSummary index={index} viewerId={viewerId} pairKey={featuredPair} />
            </section>
          ) : null}

          <OpponentList
            index={index}
            viewerId={viewerId}
            opponents={summaries}
            featured={featured}
          />
        </>
      )}
    </div>
  );
}
