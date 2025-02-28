import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId, Document, WithId } from "mongodb";
import { authOptions } from "@/lib/auth";

const MAPS = [
  "Nerve Center (Attrition)",
  "Lobby Small (Attrition)",
  "Power Station (Attrition)",
  "Downtown (Attrition)",
  "Chinatown (Attrition)",
  "Docks (Attrition)",
  "Corporate Plaza (Attrition)",
  "Underground Mall (Attrition)",
];

interface QueuePlayer {
  discordId: string;
  discordUsername: string;
  discordNickname: string;
  elo: number;
  joinedAt: number;
}

interface Queue extends WithId<Document> {
  _id: ObjectId;
  status: string;
  players: QueuePlayer[];
  gameType: string;
  eloTier: string;
}

export async function POST(
  req: NextRequest,
  { params }: { params: { queueId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db("ShadowrunWeb");

    // Get queue
    const queue = await db.collection<Queue>("Queues").findOne({
      _id: new ObjectId(params.queueId),
    });

    if (!queue) {
      return NextResponse.json({ error: "Queue not found" }, { status: 404 });
    }

    // Sort players by ELO
    const sortedPlayers = [...queue.players].sort((a, b) => b.elo - a.elo);

    // Split into teams (snake draft)
    const team1: QueuePlayer[] = [];
    const team2: QueuePlayer[] = [];

    sortedPlayers.forEach((player, index) => {
      if (index % 4 < 2) {
        team1.push(player);
      } else {
        team2.push(player);
      }
    });

    // Create match
    const match = await db.collection("Matches").insertOne({
      status: "pending",
      gameType: queue.gameType,
      eloTier: queue.eloTier,
      team1: {
        players: team1,
        averageElo: team1.reduce((sum, p) => sum + p.elo, 0) / team1.length,
      },
      team2: {
        players: team2,
        averageElo: team2.reduce((sum, p) => sum + p.elo, 0) / team2.length,
      },
      createdAt: new Date(),
      readyPlayers: queue.players.reduce(
        (acc: Record<string, boolean>, player: QueuePlayer) => {
          acc[player.discordId] = false;
          return acc;
        },
        {}
      ),
    });

    // Clear queue
    await db.collection("Queues").updateOne(
      { _id: new ObjectId(params.queueId) },
      {
        $set: {
          players: [],
          status: "open",
        },
      }
    );

    return NextResponse.json({ matchId: match.insertedId });
  } catch (error) {
    console.error("Failed to launch match:", error);
    return NextResponse.json(
      { error: "Failed to launch match" },
      { status: 500 }
    );
  }
}
