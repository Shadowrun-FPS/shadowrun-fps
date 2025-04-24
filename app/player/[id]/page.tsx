import { notFound } from "next/navigation";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import PlayerStatsPage from "@/components/player-stats-page";
import { FeatureGate } from "@/components/feature-gate";

export default async function PlayerPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;

  if (!ObjectId.isValid(id)) {
    return notFound();
  }

  try {
    const client = await clientPromise;
    const db = client.db();
    const player = await db
      .collection("Players")
      .findOne({ _id: new ObjectId(id) });

    if (!player) {
      return notFound();
    }

    // Filter out invalid stats (those without teamSize)
    const validStats = player.stats.filter(
      (stat: any) =>
        typeof stat === "object" &&
        stat !== null &&
        typeof stat.teamSize === "number"
    );

    // Create a cleaned player object with _id as string
    const cleanedPlayer = {
      ...player,
      _id: player._id.toString(), // Convert ObjectId to string
      stats: validStats,
      banExpiry: player.banExpiry || null, // Provide default for required field
    };

    return (
      <FeatureGate feature="playerStats">
        <div className="container py-6 mx-auto">
          <PlayerStatsPage player={cleanedPlayer} />
        </div>
      </FeatureGate>
    );
  } catch (error) {
    console.error("Error fetching player:", error);
    return (
      <div className="container py-6 mx-auto text-center">
        <h1 className="mb-4 text-2xl font-bold">Error</h1>
        <p>Failed to load player data</p>
      </div>
    );
  }
}
