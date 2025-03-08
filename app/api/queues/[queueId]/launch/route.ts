import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { authOptions } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";
import { isAdmin } from "@/lib/admin";

// Add the QueuePlayer interface at the top of the file
interface QueuePlayer {
  discordId: string;
  discordUsername: string;
  discordNickname?: string;
  discordProfilePicture?: string;
  elo: number;
  // Add any other properties that QueuePlayer might have
}

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { queueId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated
    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be signed in to launch a match" },
        { status: 401 }
      );
    }

    // Check if user has the required roles
    const hasRequiredRole =
      session.user.id === "238329746671271936" || // Your ID
      (session.user.roles &&
        (session.user.roles.includes("admin") ||
          session.user.roles.includes("moderator") ||
          session.user.roles.includes("founder") ||
          session.user.roles.includes("GM")));

    // Add debug logging
    console.log("Session data in launch route:", {
      user: session.user,
      userId: session.user.id,
    });

    if (!isAdmin(session.user.id)) {
      console.log("Admin check failed in launch route:", {
        userId: session.user.id,
      });
      return NextResponse.json(
        { error: "You don't have permission to launch matches" },
        { status: 403 }
      );
    }

    const client = await clientPromise;
    const db = client.db("ShadowrunWeb");

    // Get the queue
    const queue = await db.collection("Queues").findOne({
      _id: new ObjectId(params.queueId),
    });

    if (!queue) {
      return NextResponse.json({ error: "Queue not found" }, { status: 404 });
    }

    // Check if queue has enough players
    if (queue.players.length < queue.teamSize * 2) {
      return NextResponse.json(
        { error: "Not enough players to launch a match" },
        { status: 400 }
      );
    }

    // Get 3 random maps from the Maps collection
    const maps = await db
      .collection("Maps")
      .aggregate([{ $match: { rankedMap: true } }, { $sample: { size: 3 } }])
      .toArray();

    if (maps.length < 3) {
      return NextResponse.json(
        { error: "Not enough maps available" },
        { status: 500 }
      );
    }

    // Update the queue clearing logic to preserve waitlisted players
    // First, get the required number of players for a match
    const requiredPlayers = queue.teamSize * 2;

    // Take only the first requiredPlayers for the match
    const activePlayers = queue.players.slice(0, requiredPlayers);
    const waitlistedPlayers = queue.players.slice(requiredPlayers);

    // Create balanced teams with only the active players
    const players = [...activePlayers];

    // Improved team balancing algorithm using combinatorial optimization
    // This finds the most balanced teams possible by trying different combinations
    const findOptimalTeams = (players: QueuePlayer[], teamSize: number) => {
      // Sort players by ELO (highest to lowest)
      players.sort((a, b) => b.elo - a.elo);

      // Calculate total ELO
      const totalElo = players.reduce((sum, player) => sum + player.elo, 0);
      const targetElo = totalElo / 2;

      // Initialize with a basic distribution
      let bestTeam1: QueuePlayer[] = players.slice(0, teamSize);
      let bestTeam2: QueuePlayer[] = players.slice(teamSize);
      let bestDifference = Math.abs(
        bestTeam1.reduce((sum, p) => sum + p.elo, 0) -
          bestTeam2.reduce((sum, p) => sum + p.elo, 0)
      );

      // Try different combinations to find the most balanced teams
      // We'll use a greedy approach with swapping to find better combinations
      let improved = true;
      while (improved) {
        improved = false;

        // Try swapping each player from team1 with each player from team2
        for (let i = 0; i < bestTeam1.length; i++) {
          for (let j = 0; j < bestTeam2.length; j++) {
            // Create new teams with the swap
            const newTeam1 = [...bestTeam1];
            const newTeam2 = [...bestTeam2];

            // Swap players
            const temp = newTeam1[i];
            newTeam1[i] = newTeam2[j];
            newTeam2[j] = temp;

            // Calculate new difference
            const newTeam1Elo = newTeam1.reduce((sum, p) => sum + p.elo, 0);
            const newTeam2Elo = newTeam2.reduce((sum, p) => sum + p.elo, 0);
            const newDifference = Math.abs(newTeam1Elo - newTeam2Elo);

            // If this swap improves balance, keep it
            if (newDifference < bestDifference) {
              bestTeam1 = newTeam1;
              bestTeam2 = newTeam2;
              bestDifference = newDifference;
              improved = true;
            }
          }
        }
      }

      return {
        team1: bestTeam1,
        team2: bestTeam2,
        eloDifference: bestDifference,
      };
    };

    // Use the optimized team balancing function
    const { team1, team2, eloDifference } = findOptimalTeams(
      players,
      queue.teamSize
    );

    // Ensure all players have valid nicknames
    const ensureValidNicknames = (players: QueuePlayer[]) => {
      return players.map((player) => ({
        ...player,
        discordNickname:
          player.discordNickname || player.discordUsername || player.discordId,
      }));
    };

    // Update teams with valid nicknames
    const team1WithValidNicknames = ensureValidNicknames(team1);
    const team2WithValidNicknames = ensureValidNicknames(team2);

    // Randomly decide which team gets first pick
    const firstPickTeam = Math.random() < 0.5 ? 1 : 2;

    // Generate a unique match ID
    const matchId = uuidv4();

    // Create the match document
    const match = {
      matchId,
      status: "in_progress",
      teamSize: queue.teamSize,
      eloTier: queue.eloTier,
      type: "Ranked",
      firstPick: firstPickTeam,
      createdAt: Date.now(),
      createdBy: {
        discordId: session.user.id,
        discordUsername: session.user.name || "",
        discordNickname: session.user.nickname || session.user.name || "",
      },
      maps: maps.map((map) => ({
        mapName: map.name,
        gameMode: map.gameMode,
        selected: false,
      })),
      team1: team1WithValidNicknames,
      team2: team2WithValidNicknames,
      eloDifference,
      queueId: params.queueId,
    };

    // Insert the match into the database
    await db.collection("Matches").insertOne(match);

    // Update the queue to keep waitlisted players instead of clearing it
    await db
      .collection("Queues")
      .updateOne(
        { _id: new ObjectId(params.queueId) },
        { $set: { players: waitlistedPlayers } }
      );

    // After creating the match, remove active players from all other queues
    const activePlayerIds = activePlayers.map(
      (player: QueuePlayer) => player.discordId
    );

    // Update all other queues to remove these players
    await db.collection("Queues").updateMany(
      {
        _id: { $ne: new ObjectId(params.queueId) },
        "players.discordId": { $in: activePlayerIds },
      },
      {
        $pull: {
          players: { discordId: { $in: activePlayerIds } },
        },
      } as any
    );

    // Fetch all queues to send updated data via SSE
    const updatedQueues = await db.collection("Queues").find({}).toArray();

    // Emit the update event to all connected clients
    if (global.io) {
      global.io.emit("queues:update", updatedQueues);
    }

    return NextResponse.json({
      success: true,
      message: "Match launched successfully",
      matchId,
    });
  } catch (error) {
    console.error("Error launching match:", error);
    return NextResponse.json(
      { error: "Failed to launch match" },
      { status: 500 }
    );
  }
}
