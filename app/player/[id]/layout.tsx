import { Metadata, ResolvingMetadata } from "next";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

interface LayoutProps {
  children: React.ReactNode;
  params: { id: string };
}

export async function generateMetadata(
  { params }: LayoutProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  if (!ObjectId.isValid(params.id)) return {};

  try {
    const client = await clientPromise;
    const db = client.db();

    const player = await db
      .collection("Players")
      .findOne({ _id: new ObjectId(params.id) });

    if (!player) return {};

    const displayName =
      player.discordNickname || player.discordUsername || "Unknown Player";

    const title = `${displayName} - Player Stats | Shadowrun FPS`;
    let description = `View detailed player statistics and match history for ${displayName}`;

    if (player.stats && player.stats.length > 0) {
      const mainStats =
        player.stats.find((s: any) => s.teamSize === 4) || player.stats[0];
      if (mainStats?.elo) {
        description += ` - Current ELO: ${mainStats.elo}`;
      }
    }

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "profile",
        images: [
          {
            url: "/shadowrun_invite_banner.png",
            width: 1200,
            height: 630,
            alt: `${displayName} - Shadowrun FPS Player Stats`,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
      },
    };
  } catch (error) {
    console.error("Error generating player metadata:", error);
    return {};
  }
}

export default function PlayerLayout({ children }: LayoutProps) {
  return children;
}
