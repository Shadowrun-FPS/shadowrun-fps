import { Metadata, ResolvingMetadata } from "next";
import clientPromise from "@/lib/mongodb";
import { getPlayerAvatarUrl } from "@/lib/discord-helpers";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

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

export async function generateMetadata(
  { params }: LayoutProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  try {
    const { id } = await params;
    const client = await clientPromise;
    const db = client.db();

    // Try to find the player by ID or username
    const player = await db.collection("Players").findOne({
      $or: [
        { discordId: id },
        { discordUsername: id },
        { discordNickname: id },
      ],
    });

    // Create base fallback image URL (absolute URL required for social cards)
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || "https://shadowrunfps.com";
    const fallbackImage = `${baseUrl}/hero.png`;

    if (!player) {
      return {
        title: "Player Not Found | Shadowrun FPS",
        description: "The player you're looking for doesn't exist",
        openGraph: {
          title: "Player Not Found | Shadowrun FPS",
          description: "The player you're looking for doesn't exist",
          type: "website",
          images: [
            {
              url: fallbackImage,
              width: 1200,
              height: 630,
              alt: "Shadowrun FPS",
            },
          ],
        },
        twitter: {
          card: "summary_large_image",
          title: "Player Not Found | Shadowrun FPS",
          description: "The player you're looking for doesn't exist",
          images: [fallbackImage],
        },
      };
    }

    // Create dynamic metadata based on player data
    const displayName =
      player.discordNickname || player.discordUsername || "Player";
    const title = `${displayName} | Shadowrun FPS Player Stats`;

    // Create description with player stats if available
    let description = `View ${displayName}'s player statistics and match history in Shadowrun FPS`;

    // Create metadata object
    const openGraph: OpenGraphMetadata = {
      title,
      description,
      type: "profile",
      images: [
        {
          url: fallbackImage,
          width: 1200,
          height: 630,
          alt: `${displayName} - Shadowrun FPS Player`,
        },
      ],
    };

    const twitter: TwitterMetadata = {
      card: "summary_large_image",
      title,
      description,
      images: [fallbackImage],
    };

    // Add player profile image if available
    const profileImageUrl = getPlayerAvatarUrl(player, baseUrl);

    // Only use a custom image if it's not the fallback
    if (profileImageUrl !== fallbackImage) {
      const image = {
        url: profileImageUrl,
        width: 800,
        height: 800,
        alt: `${displayName} - Shadowrun FPS Player`,
      };

      openGraph.images = [image];
      twitter.images = [profileImageUrl];
    }

    return {
      title,
      description,
      openGraph,
      twitter,
    };
  } catch (error) {
    console.error("Error generating player metadata:", error);
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || "https://shadowrunfps.com";
    const fallbackImage = `${baseUrl}/hero.png`;

    return {
      title: "Player Stats | Shadowrun FPS",
      description: "View player statistics and match history",
      openGraph: {
        title: "Player Stats | Shadowrun FPS",
        description: "View player statistics and match history",
        type: "website",
        images: [
          {
            url: fallbackImage,
            width: 1200,
            height: 630,
            alt: "Shadowrun FPS",
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: "Player Stats | Shadowrun FPS",
        description: "View player statistics and match history",
        images: [fallbackImage],
      },
    };
  }
}

export default function PlayerLayout({ children }: LayoutProps) {
  return children;
}
