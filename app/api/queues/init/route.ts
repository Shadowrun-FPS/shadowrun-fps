import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

// Initialize queues for each game type and ELO tier
export async function POST() {
  try {
    const client = await clientPromise;
    const db = client.db("ShadowrunWeb");

    const gameTypes = ["1v1", "2v2", "4v4", "5v5"];
    const eloTiers = [
      { tier: "low", min: 800, max: 1400 },
      { tier: "medium", min: 1200, max: 1800 },
      { tier: "high", min: 1800, max: 2500 },
    ];

    const queues = [];

    for (const gameType of gameTypes) {
      const teamSize = parseInt(gameType[0]);

      for (const { tier, min, max } of eloTiers) {
        queues.push({
          queueId: `${gameType}-${tier}`,
          gameType,
          teamSize,
          eloTier: tier,
          minElo: min,
          maxElo: max,
          players: [],
          status: "open",
          createdAt: new Date(),
        });
      }
    }

    // Replace existing queues with new ones
    await db.collection("Queues").deleteMany({});
    await db.collection("Queues").insertMany(queues);

    return NextResponse.json({ success: true, queuesCreated: queues.length });
  } catch (error) {
    console.error("Failed to initialize queues:", error);
    return NextResponse.json(
      { error: "Failed to initialize queues" },
      { status: 500 }
    );
  }
}
