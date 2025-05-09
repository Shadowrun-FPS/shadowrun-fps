"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import PlayerStatsPage from "@/components/player-stats-page";
import { Skeleton } from "@/components/ui/skeleton";
import Head from "next/head";

export default function PlayerStatsContent() {
  const searchParams = useSearchParams();
  const playerName = searchParams?.get("playerName");
  const discordId = searchParams?.get("discordId");
  const [player, setPlayer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize with the player name from URL if available
  const initialPlayerName = playerName || "Player";
  const [pageTitle, setPageTitle] = useState<string>(
    `${initialPlayerName} - Player Stats | Shadowrun FPS`
  );
  const [pageDescription, setPageDescription] = useState<string>(
    `View detailed player statistics and match history for ${initialPlayerName}`
  );
  const [profileImage, setProfileImage] = useState<string>(
    "/shadowrun_invite_banner.png"
  );

  useEffect(() => {
    // Update document title immediately when player name is available from URL
    if (playerName) {
      const title = `${playerName} - Player Stats | Shadowrun FPS`;
      document.title = title;
      setPageTitle(title);
      setPageDescription(
        `View detailed player statistics and match history for ${playerName}`
      );
    }

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

        // Update title with player's nickname if available
        const displayName =
          data.discordNickname || data.discordUsername || playerName;
        if (displayName) {
          const title = `${displayName} - Player Stats | Shadowrun FPS`;
          document.title = title;
          setPageTitle(title);

          // Update description with ELO if available
          let description = `View detailed player statistics and match history for ${displayName}`;
          setPageDescription(description);
        }

        // Update profile image if available, with fallback and error handling
        if (data.discordAvatar) {
          // Check if the avatar URL is valid
          fetch(data.discordAvatar, { method: "HEAD" })
            .then((response) => {
              if (response.ok) {
                setProfileImage(data.discordAvatar);
              } else {
                console.warn(
                  "Discord avatar URL returned an error, using fallback image"
                );
                setProfileImage("/shadowrun_invite_banner.png");
              }
            })
            .catch((error) => {
              console.warn("Error checking Discord avatar URL:", error);
              setProfileImage("/shadowrun_invite_banner.png");
            });
        } else if (data.playerAvatar) {
          // Try playerAvatar as fallback
          setProfileImage(data.playerAvatar);
        }
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
      setError("No player identifier provided");
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
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />

        {/* OpenGraph meta tags for social sharing */}
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:image" content={profileImage} />
        <meta property="og:type" content="profile" />

        {/* Twitter meta tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content={profileImage} />
      </Head>
      <div className="container py-6 mx-auto">
        <PlayerStatsPage player={player} />
      </div>
    </>
  );
}
