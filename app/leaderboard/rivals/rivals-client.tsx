"use client";

import { useCallback, useEffect, useState } from "react";

import { RivalsBrowser } from "@/components/rivals/rivals-browser";
import { safeLog } from "@/lib/security";
import type { LeaderboardPayload } from "@/types";

async function fetchLeaderboard(): Promise<LeaderboardPayload> {
  const response = await fetch("/api/leaderboard", { cache: "no-store" });
  if (!response.ok) throw new Error("Failed to fetch leaderboard");
  return response.json() as Promise<LeaderboardPayload>;
}

export default function RivalsClient({
  initialData,
  initialPlayerId,
}: {
  initialData: LeaderboardPayload | null;
  initialPlayerId: string | null;
}) {
  const [data, setData] = useState(initialData);
  const [hasError, setHasError] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (initialData !== null) return;
    let cancelled = false;
    fetchLeaderboard()
      .then((payload) => {
        if (!cancelled) {
          setData(payload);
          setHasError(false);
        }
      })
      .catch((error) => {
        safeLog.error("Rivals client fallback failed:", error);
        if (!cancelled) setHasError(true);
      });
    return () => {
      cancelled = true;
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
        safeLog.error("Rivals refresh failed:", error);
      })
      .finally(() => setIsRefreshing(false));
  }, []);

  if (!data) {
    if (hasError) {
      return (
        <div className="rounded-xl border border-dashed border-border px-4 py-12 text-center text-sm text-muted-foreground">
          Rivalries are temporarily unavailable. Try again in a minute.
        </div>
      );
    }
    return (
      <div className="space-y-3" aria-busy="true">
        <div className="h-8 w-48 animate-pulse rounded bg-muted/50" />
        <div className="grid gap-2 md:grid-cols-3">
          {[1, 2, 3].map((placeholder) => (
            <div key={placeholder} className="h-40 animate-pulse rounded-xl bg-muted/50" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <RivalsBrowser
      data={data}
      initialPlayerId={initialPlayerId}
      onRefresh={refresh}
      isRefreshing={isRefreshing}
    />
  );
}
