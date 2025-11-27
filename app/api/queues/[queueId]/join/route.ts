import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId, Document, WithId } from "mongodb";
import { authOptions } from "@/lib/auth";
import { Session } from "next-auth";
import { sendDirectMessage } from "@/lib/discord-bot";
import { SECURITY_CONFIG } from "@/lib/security-config";
import { notifyQueueReady, getGuildId } from "@/lib/discord-bot-api";

export const dynamic = "force-dynamic";

interface QueuePlayer {
  discordId: string;
  discordUsername: string;
  discordNickname: string;
  elo: number;
  joinedAt: number; // Unix timestamp
  discordProfilePicture: string;
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
      "stats.teamSize": queue.teamSize,
    });

    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    const statsForTeamSize = player.stats.find(
      (stat: { teamSize: any }) => stat.teamSize === queue.teamSize
    );

    if (!statsForTeamSize?.elo) {
      return NextResponse.json(
        {
          error: `You don't have an ELO rating for ${queue.teamSize}v${queue.teamSize} yet`,
        },
        { status: 400 }
      );
    }

    if (statsForTeamSize.elo > queue.maxElo) {
      return NextResponse.json(
        {
          error: `Your ELO (${statsForTeamSize.elo}) is too high for this queue (max: ${queue.maxElo})`,
        },
        { status: 400 }
      );
    }

    if (statsForTeamSize.elo < queue.minElo) {
      return NextResponse.json(
        {
          error: `Your ELO (${statsForTeamSize.elo}) is too low for this queue (min: ${queue.minElo})`,
        },
        { status: 400 }
      );
    }

    const activeMatch = await db.collection("Matches").findOne({
      $or: [
        { "team1.discordId": session.user.id },
        { "team2.discordId": session.user.id },
      ],
      status: { $in: ["draft", "ready", "in_progress", "map_selection"] },
    });

    if (activeMatch) {
      return NextResponse.json(
        {
          error: "You are already in an active match",
          matchId: activeMatch.matchId,
        },
        { status: 400 }
      );
    }

    const newPlayer = {
      discordId: session.user.id,
      discordUsername: player.discordUsername,
      discordNickname: player.discordNickname || player.discordUsername,
      discordProfilePicture:
        session.user.image ||
        `https://cdn.discordapp.com/avatars/${session.user.id}/avatar.png`,
      joinedAt: Date.now(),
      elo: statsForTeamSize.elo,
    };

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

    const updatedQueues = await db.collection("Queues").find({}).toArray();

    if (global.io) {
      global.io.emit("queues:update", updatedQueues);
    }

    // Check if the queue is now full after adding this player
    const updatedQueue = await db.collection("Queues").findOne({
      _id: new ObjectId(params.queueId),
    });

    if (
      updatedQueue &&
      updatedQueue.players.length === updatedQueue.teamSize * 2
    ) {
      // Send queue ready notifications via Discord bot API (primary method)
      // Change streams will act as fallback if API fails (with duplicate prevention)
      try {
        const guildId = getGuildId();
        await notifyQueueReady(updatedQueue.queueId || params.queueId, guildId);
      } catch (error) {
        // Don't throw - change stream will catch it as fallback with duplicate prevention
      }

      // Also send in-app notifications
      for (const player of updatedQueue.players) {
        if (global.io) {
          const userNotifications = await db
            .collection("Notifications")
            .find({ userId: player.discordId, read: false })
            .sort({ createdAt: -1 })
            .toArray();

          global.io
            .to(player.discordId)
            .emit("notifications:update", userNotifications);
        }
      }
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
