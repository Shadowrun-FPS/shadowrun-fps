import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import PlayerStatsContent from "@/components/player-stats-content";
import { Metadata, ResolvingMetadata } from "next";
import clientPromise from "@/lib/mongodb";
import { FeatureGate } from "@/components/feature-gate";
import { getPlayerAvatarUrl } from "@/lib/discord-helpers";

// Define types for our OpenGraph and Twitter objects
interface OpenGraphMetadata {
  title: string;
  description: string;
  type: string;
  images?: Array<{
    url: string;
    width: number;
    height: number;
    alt: string;
  }>;
}

interface TwitterMetadata {
  card: string;
  title: string;
  description: string;
  images?: string[];
}

interface PlayerStats {
  teamSize: number;
  elo: number;
  // Add other stats properties as needed
}

// For Next.js page/layout metadata
type MetadataProps = {
  params: Record<string, string>;
  searchParams: { [key: string]: string | string[] | undefined };
};

export async function generateMetadata(
  { searchParams }: MetadataProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  // Read route params
  const playerName =
    typeof searchParams.playerName === "string"
      ? searchParams.playerName
      : undefined;

  const discordId =
    typeof searchParams.discordId === "string"
      ? searchParams.discordId
      : undefined;

  let title = `${playerName || "Player"} - Stats | Shadowrun FPS`;
  let description = `View detailed statistics and match history for ${
    playerName || "this player"
  } in Shadowrun FPS`;

  // Create base fallback image URL (absolute URL required for social cards)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://shadowrunfps.com";
  const fallbackImage = `${baseUrl}/hero.png`;

  // Create base metadata objects
  const openGraph: OpenGraphMetadata = {
    title,
    description,
    type: "profile",
    images: [
      {
        url: fallbackImage,
        width: 1200,
        height: 630,
        alt: "Shadowrun FPS Player Stats",
      },
    ],
  };

  const twitter: TwitterMetadata = {
    card: "summary_large_image",
    title,
    description,
    images: [fallbackImage],
  };

  // If we have a discordId, try to fetch the player's data for a better card
  if (discordId) {
    try {
      const client = await clientPromise;
      const db = client.db();

      const player = await db.collection("Players").findOne({ discordId });

      if (player) {
        // Use nickname if available, otherwise use username or default to playerName
        const displayName =
          player.discordNickname ||
          player.discordUsername ||
          playerName ||
          "Player";

        // Update title to use the display name
        title = `${displayName} - Stats | Shadowrun FPS`;
        description = `View detailed statistics and match history for ${displayName} in Shadowrun FPS`;

        // Update the metadata objects with the new title and description
        openGraph.title = title;
        openGraph.description = description;
        twitter.title = title;
        twitter.description = description;

        // Use player's profile picture if available
        const profileImageUrl = getPlayerAvatarUrl(player, baseUrl);

        // Only use a custom image if it's not the fallback
        if (profileImageUrl !== fallbackImage) {
          const image = {
            url: profileImageUrl,
            width: 800,
            height: 800,
            alt: `${displayName} - Shadowrun FPS Stats`,
          };

          openGraph.images = [image];
          twitter.images = [profileImageUrl];
        }
      } else {
        console.log(`Player not found for discordId: ${discordId}`);
      }
    } catch (error) {
      console.error("Error fetching player data for metadata:", error);
    }
  } else if (playerName) {
    // If we have a playerName but no discordId, try to find the player by name
    try {
      const client = await clientPromise;
      const db = client.db();

      // Try to find player by nickname first, then by username
      const player = await db.collection("Players").findOne({
        $or: [{ discordNickname: playerName }, { discordUsername: playerName }],
      });

      if (player) {
        // Use nickname if available, otherwise use username
        const displayName =
          player.discordNickname || player.discordUsername || playerName;

        // Update title to use the display name
        title = `${displayName} - Stats | Shadowrun FPS`;
        description = `View detailed statistics and match history for ${displayName} in Shadowrun FPS`;

        // Update the metadata objects with the new title and description
        openGraph.title = title;
        openGraph.description = description;
        twitter.title = title;
        twitter.description = description;

        // Use player's profile picture if available
        const profileImageUrl = getPlayerAvatarUrl(player, baseUrl);

        // Only use a custom image if it's not the fallback
        if (profileImageUrl !== fallbackImage) {
          const image = {
            url: profileImageUrl,
            width: 800,
            height: 800,
            alt: `${displayName} - Shadowrun FPS Stats`,
          };

          openGraph.images = [image];
          twitter.images = [profileImageUrl];
        }
      }
    } catch (error) {
      console.error("Error fetching player data for metadata:", error);
    }
  }

  return {
    title,
    description,
    openGraph,
    twitter,
  };
}

// Main page component with Suspense boundary
export default function StatsPage() {
  return (
    <FeatureGate feature="playerStats">
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
    </FeatureGate>
  );
}
