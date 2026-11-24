"use client";

import { useCallback, useEffect, useState } from "react";

import { LeaderboardBrowser } from "@/components/leaderboard/leaderboard-browser";
import { safeLog } from "@/lib/security";
import type { LeaderboardPayload } from "@/types";

interface LeaderboardClientProps {
  initialData: LeaderboardPayload | null;
}

async function fetchLeaderboard(): Promise<LeaderboardPayload> {
  const response = await fetch("/api/leaderboard", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Failed to fetch leaderboard");
  }
  return response.json() as Promise<LeaderboardPayload>;
}

export default function LeaderboardClient({
  initialData,
}: LeaderboardClientProps) {
  const [data, setData] = useState<LeaderboardPayload | null>(initialData);
  const [hasError, setHasError] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (initialData !== null) return;

    let isCancelled = false;
    fetchLeaderboard()
      .then((payload) => {
        if (!isCancelled) {
          setData(payload);
          setHasError(false);
        }
      })
      .catch((error) => {
        safeLog.error("Leaderboard client fallback failed:", error);
        if (!isCancelled) setHasError(true);
      });

    return () => {
      isCancelled = true;
    };
  }, [initialData]);

  const refresh = useCallback(() => {
    setIsRefreshing(true);
    fetchLeaderboard()
      .then((payload) => {
        setData(payload);
        setHasError(false);
      })
      .catch((error) => {
        safeLog.error("Leaderboard refresh failed:", error);
      })
      .finally(() => {
        setIsRefreshing(false);
      });
  }, []);

  if (!data) {
    if (hasError) {
      return (
        <div className="rounded-xl border border-dashed border-border px-4 py-12 text-center text-sm text-muted-foreground">
          Ranked standings are temporarily unavailable. Try again in a minute.
        </div>
      );
    }

    return (
      <div className="space-y-3" aria-busy="true">
        <div className="h-8 w-48 animate-pulse rounded bg-muted/50" />
        <div className="grid gap-2 md:grid-cols-3">
          {[1, 2, 3].map((placeholder) => (
            <div
              key={placeholder}
              className="h-24 animate-pulse rounded-xl bg-muted/50"
            />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-xl bg-muted/40" />
      </div>
    );
  }

  return (
    <LeaderboardBrowser
      data={data}
      onRefresh={refresh}
      isRefreshing={isRefreshing}
    />
  );
}
