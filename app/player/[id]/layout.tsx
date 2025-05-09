import { Metadata, ResolvingMetadata } from "next";
import clientPromise from "@/lib/mongodb";

interface LayoutProps {
  children: React.ReactNode;
  params: { id: string };
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
    const client = await clientPromise;
    const db = client.db();

    // Try to find the player by ID or username
    const player = await db.collection("Players").findOne({
      $or: [
        { discordId: params.id },
        { discordUsername: params.id },
        { discordNickname: params.id },
      ],
    });

    if (!player) {
      return {
        title: "Player Not Found | Shadowrun FPS",
        description: "The player you're looking for doesn't exist",
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
    };

    const twitter: TwitterMetadata = {
      card: "summary",
      title,
      description,
    };

    // Add player profile image if available
    if (player.discordProfilePicture) {
      const image = {
        url: player.discordProfilePicture,
        width: 800,
        height: 800,
        alt: `${displayName} - Shadowrun FPS Player`,
      };

      openGraph.images = [image];
      twitter.images = [player.discordProfilePicture];
    }

    return {
      title,
      description,
      openGraph,
      twitter,
    };
  } catch (error) {
    console.error("Error generating player metadata:", error);
    return {
      title: "Player Stats | Shadowrun FPS",
      description: "View player statistics and match history",
    };
  }
}

export default function PlayerLayout({ children }: LayoutProps) {
  return children;
}
