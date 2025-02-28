import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId, Document, WithId } from "mongodb";
import { sendDiscordWebhook } from "@/lib/discord";

interface Player {
  discordId: string;
  name: string;
}

interface Match extends WithId<Document> {
  _id: ObjectId;
  team1: {
    players: Player[];
  };
  team2: {
    players: Player[];
  };
  readyCheck?: {
    status: string;
    readyPlayers: string[];
    startedAt: Date;
  };
}

export async function POST(req: NextRequest) {
  try {
    const { matchId } = await req.json();
    const client = await clientPromise;
    const db = client.db("ShadowrunWeb");

    const match = await db.collection<Match>("Matches").findOne({
      _id: new ObjectId(matchId),
    });

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    const allPlayers = [...match.team1.players, ...match.team2.players].map(
      (p) => p.discordId
    );

    // Start ready check
    await db.collection("Matches").updateOne(
      { _id: new ObjectId(matchId) },
      {
        $set: {
          readyCheck: {
            status: "pending",
            readyPlayers: [],
            startedAt: new Date(),
          },
        },
      }
    );

    return NextResponse.json({ success: true, players: allPlayers });
  } catch (error) {
    console.error("Failed to start ready check:", error);
    return NextResponse.json(
      { error: "Failed to start ready check" },
      { status: 500 }
    );
  }
}
