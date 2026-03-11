import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import PlayerStatsContent from "@/components/player-stats-content";
import { Metadata, ResolvingMetadata } from "next";
import clientPromise from "@/lib/mongodb";
import { FeatureGate } from "@/components/feature-gate";
import { getRankByElo } from "@/lib/rank-utils";

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

type StatEntry = {
  teamSize: number;
  elo: number;
  wins?: number;
  losses?: number;
  lastMatchDate?: string;
};

// For Next.js page/layout metadata (Next 15: searchParams is a Promise)
type MetadataProps = {
  params: Promise<Record<string, string>>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

/** Fetch player with same logic as byName/byId: ShadowrunWeb + ShadowrunDB2 4v4 merge */
async function getPlayerForMetadata(
  playerName: string | undefined,
  discordId: string | undefined
): Promise<{
  displayName: string;
  stats: StatEntry[];
} | null> {
  const client = await clientPromise;
  const webDb = client.db("ShadowrunWeb");
  const db2 = client.db("ShadowrunDB2");

  let webPlayer: Record<string, unknown> | null = null;

  if (discordId) {
    webPlayer = await webDb.collection("Players").findOne({ discordId }) as Record<string, unknown> | null;
  } else if (playerName && playerName.trim()) {
    const escaped = playerName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    webPlayer = await webDb.collection("Players").findOne({
      $or: [
        { discordUsername: { $regex: new RegExp(`^${escaped}$`, "i") } },
        { discordNickname: { $regex: new RegExp(`^${escaped}$`, "i") } },
      ],
    }) as Record<string, unknown> | null;
  }

  if (!webPlayer) return null;

  const displayName =
    (webPlayer.discordNickname as string) ||
    (webPlayer.discordUsername as string) ||
    playerName ||
    "Player";

  let stats: StatEntry[] = Array.isArray(webPlayer.stats) ? [...(webPlayer.stats as StatEntry[])] : [];

  const db2Player = await db2.collection("players").findOne({
    discordId: webPlayer.discordId,
  });

  const db2Record = db2Player as Record<string, unknown> | null;
  if (db2Record && db2Record.rating !== undefined) {
    const db2Stats: StatEntry = {
      teamSize: 4,
      elo: Number(db2Record.rating),
      wins: Number(db2Record.wins ?? 0),
      losses: Number(db2Record.losses ?? 0),
      lastMatchDate: typeof db2Record.lastMatchDate === "string" ? db2Record.lastMatchDate : undefined,
    };
    const i = stats.findIndex((s) => s.teamSize === 4);
    if (i >= 0) stats[i] = db2Stats;
    else stats.push(db2Stats);
  }

  return { displayName, stats };
}

/** Build description from preferred mode (4v4 first), then fallback mode or generic */
function buildDescription(
  displayName: string,
  stats: StatEntry[]
): string {
  const prefer4v4 = stats.find((s) => s.teamSize === 4);
  const fallback = stats.find((s) => s.teamSize === 2 || s.teamSize === 5 || s.teamSize === 1);
  const primary = prefer4v4 ?? fallback ?? stats[0];

  if (!primary) {
    return `View ${displayName}'s profile and statistics on Shadowrun FPS.`;
  }

  const modeLabel = `${primary.teamSize}v${primary.teamSize}`;
  const rank = getRankByElo(primary.elo);
  const wins = primary.wins ?? 0;
  const losses = primary.losses ?? 0;
  const total = wins + losses;
  const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;

  const sentence =
    `${displayName} has a rank of ${rank.name} with an ELO of ${primary.elo.toLocaleString()} in ${modeLabel}. ` +
    `Their win rate is ${winRate}% with ${total.toLocaleString()} total matches. ` +
    `View full profile for detailed statistics and match history.`;

  return sentence;
}

export async function generateMetadata(
  { searchParams }: MetadataProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const resolved = await searchParams;
  const playerName =
    typeof resolved.playerName === "string" ? resolved.playerName : undefined;
  const discordId =
    typeof resolved.discordId === "string" ? resolved.discordId : undefined;

  let title = `${playerName || "Player"} - Stats | Shadowrun FPS`;
  let description = `View detailed statistics and match history for ${playerName || "this player"} in Shadowrun FPS.`;

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://shadowrunfps.com";
  const fallbackImage = `${baseUrl}/hero.png`;

  // Always use default site image for social cards (no Discord avatar)
  const openGraph: OpenGraphMetadata = {
    title,
    description,
    type: "profile",
    images: [
      { url: fallbackImage, width: 1200, height: 630, alt: "Shadowrun FPS" },
    ],
  };

  const twitter: TwitterMetadata = {
    card: "summary_large_image",
    title,
    description,
    images: [fallbackImage],
  };

  try {
    const playerData = await getPlayerForMetadata(playerName, discordId);
    if (playerData) {
      title = `${playerData.displayName} - Stats | Shadowrun FPS`;
      description = buildDescription(playerData.displayName, playerData.stats);
      openGraph.title = title;
      openGraph.description = description;
      twitter.title = title;
      twitter.description = description;
    }
  } catch (error) {
    console.error("Error fetching player data for metadata:", error);
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
