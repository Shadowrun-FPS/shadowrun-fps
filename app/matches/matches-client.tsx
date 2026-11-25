"use client";

import { Suspense, useCallback, useEffect, useState } from "react";

import { MatchesBrowser } from "@/components/matches/matches-browser";
import { safeLog } from "@/lib/security";
import type { LeaderboardPayload, RankedMatchesPayload } from "@/types";

interface MatchesClientProps {
  initialData: RankedMatchesPayload | null;
  initialLeaderboard: LeaderboardPayload | null;
}

async function fetchMatches(): Promise<RankedMatchesPayload> {
  const response = await fetch("/api/matches", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Failed to fetch matches");
  }
  return response.json() as Promise<RankedMatchesPayload>;
}

async function fetchLeaderboard(): Promise<LeaderboardPayload> {
  const response = await fetch("/api/leaderboard", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Failed to fetch leaderboard");
  }
  return response.json() as Promise<LeaderboardPayload>;
}

function MatchesLoading() {
  return (
    <div className="space-y-3" aria-busy="true">
      <div className="h-10 animate-pulse rounded-lg bg-muted/50" />
      {[1, 2, 3].map((placeholder) => (
        <div
          key={placeholder}
          className="h-24 animate-pulse rounded-xl bg-muted/40"
        />
      ))}
    </div>
  );
}

export default function MatchesClient({
  initialData,
  initialLeaderboard,
}: MatchesClientProps) {
  const [data, setData] = useState<RankedMatchesPayload | null>(initialData);
  const [leaderboard, setLeaderboard] = useState<LeaderboardPayload | null>(
    initialLeaderboard,
  );
  const [hasError, setHasError] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (initialData !== null) return;

    let isCancelled = false;
    fetchMatches()
      .then((payload) => {
        if (!isCancelled) {
          setData(payload);
          setHasError(false);
        }
      })
      .catch((error) => {
        safeLog.error("Matches client fallback failed:", error);
        if (!isCancelled) setHasError(true);
      });

    return () => {
      isCancelled = true;
    };
  }, [initialData]);

  const refresh = useCallback(() => {
    setIsRefreshing(true);
    Promise.all([
      fetchMatches(),
      fetchLeaderboard().catch((error) => {
        safeLog.error("Leaderboard refresh failed:", error);
        return null;
      }),
    ])
      .then(([payload, roster]) => {
        setData(payload);
        if (roster) setLeaderboard(roster);
        setHasError(false);
      })
      .catch((error) => {
        safeLog.error("Matches refresh failed:", error);
        setHasError(true);
      })
      .finally(() => {
        setIsRefreshing(false);
      });
  }, []);

  if (!data) {
    if (hasError) {
      return (
        <div className="rounded-xl border border-dashed border-border px-4 py-12 text-center text-sm text-muted-foreground">
          <p>Ranked matches are temporarily unavailable. Try again in a minute.</p>
          <button
            type="button"
            onClick={refresh}
            className="mt-3 text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Retry
          </button>
        </div>
      );
    }

    return <MatchesLoading />;
  }

  return (
    <Suspense fallback={<MatchesLoading />}>
      <MatchesBrowser
        seriesList={data.series}
        updatedAt={data.updatedAt}
        players={leaderboard?.players ?? []}
        unlistedPlayers={leaderboard?.unlistedPlayers ?? []}
        leaderboardMatches={leaderboard?.matches ?? []}
        onRefresh={refresh}
        isRefreshing={isRefreshing}
      />
    </Suspense>
  );
}
