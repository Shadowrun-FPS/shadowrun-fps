"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import PlayerStatsPage from "@/components/player-stats-page";
import { Skeleton } from "@/components/ui/skeleton";

// Create a client component that uses useSearchParams
function PlayerStatsContent() {
  const searchParams = useSearchParams();
  const playerName = searchParams?.get("playerName");
  const discordId = searchParams?.get("discordId");
  const [player, setPlayer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPlayer() {
      setLoading(true);
      setError(null);

      try {
        let url;
        // Prefer playerName if available
        if (playerName) {
          url = `/api/players/byName?name=${encodeURIComponent(playerName)}`;
        } else if (discordId) {
          url = `/api/players/byId?id=${encodeURIComponent(discordId)}`;
        } else {
          throw new Error("No player identifier provided");
        }

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(
            `Failed to fetch player data: ${response.statusText}`
          );
        }

        const data = await response.json();
        setPlayer(data);
      } catch (error) {
        console.error("Error fetching player:", error);
        setError(
          error instanceof Error ? error.message : "Failed to load player data"
        );
      } finally {
        setLoading(false);
      }
    }

    if (playerName || discordId) {
      fetchPlayer();
    } else {
      setError("No player specified");
      setLoading(false);
    }
  }, [playerName, discordId]);

  if (loading) {
    return (
      <div className="container py-6 mx-auto">
        <div className="space-y-4">
          <Skeleton className="w-1/3 h-12" />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-6 mx-auto text-center">
        <h1 className="mb-4 text-2xl font-bold">Error</h1>
        <p>{error}</p>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="container py-6 mx-auto text-center">
        <h1 className="mb-4 text-2xl font-bold">Player Not Found</h1>
        <p>The player you&apos;re looking for doesn&apos;t exist</p>
      </div>
    );
  }

  return (
    <div className="container py-6 mx-auto">
      <PlayerStatsPage player={player} />
    </div>
  );
}

// Main page component with Suspense boundary
export default function StatsPage() {
  return (
    <Suspense
      fallback={
        <div className="container py-6 mx-auto">
          <div className="space-y-4">
            <Skeleton className="w-1/3 h-12" />
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Skeleton className="h-64" />
              <Skeleton className="h-64" />
              <Skeleton className="h-64" />
              <Skeleton className="h-64" />
            </div>
          </div>
        </div>
      }
    >
      <PlayerStatsContent />
    </Suspense>
  );
}
