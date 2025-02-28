import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId, Document, WithId } from "mongodb";
import { authOptions } from "@/lib/auth";
import { Session } from "next-auth";

interface QueuePlayer {
  discordId: string;
  discordUsername: string;
  discordNickname: string;
  elo: number;
  joinedAt: number; // Unix timestamp
}

interface Queue extends WithId<Document> {
  _id: ObjectId;
  status: string;
  players: QueuePlayer[];
  minElo: number;
  maxElo: number;
  teamSize: number; // Add this to know which ELO to check
  eloTier: string;
}

const MAPS = [
  "Nerve Center (Attrition)",
  "Lobby (Attrition)",
  "Lobby Small (Attrition)",
  "Power Station (Attrition)",
  "Downtown (Attrition)",
  "Chinatown (Attrition)",
  "Docks (Attrition)",
  "Corporate Plaza (Attrition)",
  "Underground Mall (Attrition)",
];

// Define the Discord user type
interface DiscordUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  nickname?: string | null;
  guild?: any;
  global_name?: string;
}

// Define the Discord session type
interface DiscordSession extends Omit<Session, "user"> {
  user: DiscordUser;
}

interface PlayerStats {
  teamSize: {
    [key: string]: {
      elo: number;
      wins?: number;
      losses?: number;
    };
  };
}

async function createMatch(db: any, queue: any) {
  // Balance teams based on ELO
  const sortedPlayers = queue.players.sort((a: any, b: any) => b.elo - a.elo);
  const team1: any[] = [];
  const team2: any[] = [];

  // Distribute players to balance teams (snake draft)
  sortedPlayers.forEach((player: any, index: number) => {
    if (index % 4 < 2) {
      team1.push(player);
    } else {
      team2.push(player);
    }
  });

  // Create the match
  const match = await db.collection("Matches").insertOne({
    status: "pending",
    gameType: queue.gameType,
    eloTier: queue.eloTier,
    team1: {
      players: team1,
      averageElo:
        team1.reduce((sum: number, p: any) => sum + p.elo, 0) / team1.length,
    },
    team2: {
      players: team2,
      averageElo:
        team2.reduce((sum: number, p: any) => sum + p.elo, 0) / team2.length,
    },
    createdAt: new Date(),
  });

  // Clear the queue
  await db.collection("Queues").updateOne(
    { _id: new ObjectId(queue._id) },
    {
      $set: {
        players: [],
        status: "open",
      },
    }
  );

  return match;
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

    // Get queue and player info
    const queue = await db.collection("Queues").findOne({
      _id: new ObjectId(params.queueId),
    });

    if (!queue) {
      return NextResponse.json({ error: "Queue not found" }, { status: 404 });
    }

    const player = await db.collection("Players").findOne({
      discordId: session.user.id,
    });

    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    const teamSizeKey = queue.teamSize;

    // Find the stats object where teamSize matches queue's team size
    const statsForTeamSize = player.stats?.find(
      (stat: any) => stat.teamSize === teamSizeKey
    );

    const playerElo = statsForTeamSize?.elo;

    // Debug log for player info
    console.log({
      attemptingToJoinQueue: {
        queueId: params.queueId,
        queueTeamSize: queue.teamSize,
        queueEloRange: `${queue.minElo}-${queue.maxElo}`,
        player: {
          discordId: player.discordId,
          discordUsername: player.discordUsername,
          discordNickname: player.discordNickname,
        },
        playerStats: {
          teamSize: teamSizeKey,
          foundStats: statsForTeamSize,
          elo: playerElo,
        },
      },
    });

    if (!playerElo) {
      return NextResponse.json(
        {
          error: `You don't have an ELO rating for ${queue.teamSize}v${queue.teamSize} yet`,
        },
        { status: 400 }
      );
    }

    // Check ELO requirements
    if (Number(playerElo) > queue.maxElo) {
      return NextResponse.json(
        {
          error: `Your ELO (${playerElo}) is too high for this queue (max: ${queue.maxElo})`,
        },
        { status: 400 }
      );
    }

    if (Number(playerElo) < queue.minElo) {
      return NextResponse.json(
        {
          error: `Your ELO (${playerElo}) is too low for this queue (min: ${queue.minElo})`,
        },
        { status: 400 }
      );
    }

    // Create the player object with proper typing
    const newPlayer: QueuePlayer = {
      discordId: session.user.id,
      discordUsername: player.discordUsername,
      discordNickname: player.discordNickname,
      joinedAt: Date.now(),
      elo: Number(playerElo),
    };

    // Add player to queue with proper typing
    const result = await db.collection<Queue>("Queues").updateOne(
      { _id: new ObjectId(params.queueId) },
      {
        $push: {
          players: newPlayer,
        } as any, // Type assertion needed due to MongoDB types limitation
      }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: "Failed to join queue" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to join queue:", error);
    return NextResponse.json(
      { error: "Failed to join queue" },
      { status: 500 }
    );
  }
}
