import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { calculateElo, getTier } from "@/lib/elo";
import { ObjectId, Document, WithId } from "mongodb";

interface EloHistory {
  oldElo: number;
  newElo: number;
  change: number;
  timestamp: Date;
}

interface Player extends WithId<Document> {
  _id: ObjectId;
  discordId: string;
  elo: number;
  eloHistory: EloHistory[];
}

export async function GET(
  req: NextRequest,
  { params }: { params: { playerId: string } }
) {
  try {
    const client = await clientPromise;
    const db = client.db("ShadowrunWeb");

    const player = await db.collection("Players").findOne({
      discordId: params.playerId,
    });

    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    return NextResponse.json({
      elo: player.elo || 1500,
      tier: getTier(player.elo || 1500),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch player ELO" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { playerId: string } }
) {
  try {
    const { newElo } = await req.json();
    const client = await clientPromise;
    const db = client.db("ShadowrunWeb");

    // Get current ELO
    const player = await db.collection<Player>("Players").findOne({
      discordId: params.playerId,
    });

    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    const currentElo = player.elo;
    const change = newElo - currentElo;

    // Update player's ELO and add to history
    const result = await db.collection<Player>("Players").findOneAndUpdate(
      { discordId: params.playerId },
      {
        $set: { elo: newElo },
        $push: {
          eloHistory: {
            oldElo: currentElo,
            newElo,
            change,
            timestamp: new Date(),
          },
        } as any, // Need to use any here due to MongoDB types limitation
      },
      { returnDocument: "after" }
    );

    if (!result || !result.value) {
      return NextResponse.json(
        { error: "Failed to update ELO" },
        { status: 500 }
      );
    }

    return NextResponse.json(result.value);
  } catch (error) {
    console.error("Failed to update player ELO:", error);
    return NextResponse.json(
      { error: "Failed to update player ELO" },
      { status: 500 }
    );
  }
}
