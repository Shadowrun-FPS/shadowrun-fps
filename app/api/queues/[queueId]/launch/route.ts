import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { authOptions } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";
import { isAdmin } from "@/lib/admin";
import { SECURITY_CONFIG } from "@/lib/security-config";

// Add the QueuePlayer interface at the top of the file
interface QueuePlayer {
  discordId: string;
  discordUsername: string;
  discordNickname?: string;
  discordProfilePicture?: string;
  elo: number;
  // Add any other properties that QueuePlayer might have
}

// Add interface for map
interface QueueMap {
  name: string;
  gameMode: string;
  // Add other properties as needed
}

// Update the map interface to reflect the actual structure
interface GameMap {
  name: string;
  src: string;
  gameMode: string;
  rankedMap: boolean;
  smallOption?: boolean;
  isSmall?: boolean;
  _id?: ObjectId;
}

export const dynamic = "force-dynamic";

// Function to find the most balanced teams
function createBalancedTeams(
  players: QueuePlayer[],
  teamSize: number
): [QueuePlayer[], QueuePlayer[]] {
  const totalPlayers = players.length;
  if (totalPlayers !== teamSize * 2) {
    throw new Error(
      `Expected ${teamSize * 2} players, but got ${totalPlayers}`
    );
  }

  // Generate all possible team combinations
  // We only need to choose team1, as team2 will be the remaining players
  const indices = Array.from({ length: totalPlayers }, (_, i) => i);

  let bestDifference = Infinity;
  let bestTeam1Indices: number[] = [];

  // Generate all possible combinations of teamSize players from totalPlayers
  const allCombinations = generateCombinations(indices, teamSize);

  // Evaluate each combination
  for (const team1Indices of allCombinations) {
    const team2Indices = indices.filter((i) => !team1Indices.includes(i));

    // Calculate team ELOs
    const team1Elo = team1Indices.reduce((sum, i) => sum + players[i].elo, 0);
    const team2Elo = team2Indices.reduce((sum, i) => sum + players[i].elo, 0);

    // Calculate the absolute difference
    const difference = Math.abs(team1Elo - team2Elo);

    // Update if this is better than our current best
    if (difference < bestDifference) {
      bestDifference = difference;
      bestTeam1Indices = team1Indices;
    }
  }

  // Create the teams based on the best combination found
  const team1 = bestTeam1Indices.map((i) => players[i]);
  const team2 = indices
    .filter((i) => !bestTeam1Indices.includes(i))
    .map((i) => players[i]);

  return [team1, team2];
}

// Helper function to generate all combinations of size k from array
function generateCombinations<T>(array: T[], k: number): T[][] {
  const result: T[][] = [];

  // Helper function for recursive combination generation
  function backtrack(start: number, current: T[]) {
    if (current.length === k) {
      result.push([...current]);
      return;
    }

    for (let i = start; i < array.length; i++) {
      current.push(array[i]);
      backtrack(i + 1, current);
      current.pop();
    }
  }

  backtrack(0, []);
  return result;
}

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
      session?.user?.id === SECURITY_CONFIG.DEVELOPER_ID ||
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
    const teamSize = queue.teamSize || 4; // Default to 4 if not specified
    if (queue.players.length < teamSize * 2) {
      return NextResponse.json(
        { error: `Need ${teamSize * 2} players to start a match` },
        { status: 400 }
      );
    }

    // Sort players by ELO to optimize initial placement
    const sortedPlayers = [...queue.players].sort((a, b) => b.elo - a.elo);

    // Create balanced teams
    const [team1, team2] = createBalancedTeams(sortedPlayers, teamSize);

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

    // Add this before creating the match document
    console.log("Queue data:", {
      queueId: params.queueId,
      teamSize: queue.teamSize,
      playerCount: queue.players.length,
      hasMaps: !!queue.maps,
      mapsCount: queue.maps?.length || 0,
    });

    // Fetch all ranked maps from the Maps collection
    const rankedMaps = await db
      .collection("Maps")
      .find({ rankedMap: true })
      .toArray();

    // Create an array that includes both normal and small variants of maps
    const allMapsWithVariants: GameMap[] = [];

    for (const map of rankedMaps) {
      // Add the regular map with proper type casting
      allMapsWithVariants.push({
        name: map.name,
        src: map.src,
        gameMode: map.gameMode,
        rankedMap: map.rankedMap,
        smallOption: map.smallOption,
        isSmall: false,
        _id: map._id,
      });

      // If smallOption is true, add a small variant with proper type casting
      if (map.smallOption) {
        allMapsWithVariants.push({
          name: `${map.name} (Small)`,
          src: map.src,
          gameMode: map.gameMode,
          rankedMap: map.rankedMap,
          smallOption: map.smallOption,
          isSmall: true,
          _id: map._id,
        });
      }
    }

    // Randomly select 3 maps (or fewer if not enough maps available)
    const shuffled = [...allMapsWithVariants].sort(() => 0.5 - Math.random());
    const randomMaps = shuffled
      .slice(0, Math.min(3, shuffled.length))
      .map((map) => ({
        mapName: map.name,
        mapImage: map.src,
        gameMode: map.gameMode,
        isSmall: map.isSmall,
        selected: false,
      }));

    // Create the match document with the randomly selected maps
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
      maps:
        randomMaps.length > 0
          ? randomMaps
          : [
              // Default maps if no ranked maps are available
              { mapName: "Pinnacle", gameMode: "Attrition", selected: false },
              {
                mapName: "Power Station",
                gameMode: "Attrition",
                selected: false,
              },
              { mapName: "Lobby", gameMode: "Attrition", selected: false },
            ],
      team1: team1WithValidNicknames.map((player) => ({
        discordId: player.discordId,
        discordUsername: player.discordUsername,
        discordNickname: player.discordNickname || player.discordUsername,
        discordProfilePicture: player.discordProfilePicture,
        initialElo: player.elo,
        elo: player.elo,
        eloChange: 0,
        updatedElo: player.elo,
        isReady: false,
      })),
      team2: team2WithValidNicknames.map((player) => ({
        discordId: player.discordId,
        discordUsername: player.discordUsername,
        discordNickname: player.discordNickname || player.discordUsername,
        discordProfilePicture: player.discordProfilePicture,
        initialElo: player.elo,
        elo: player.elo,
        eloChange: 0,
        updatedElo: player.elo,
        isReady: false,
      })),
      eloDifference: 0,
      queueId: params.queueId,
    };

    // Insert the match into the database
    await db.collection("Matches").insertOne(match);

    // Update the queue to keep waitlisted players instead of clearing it
    await db
      .collection("Queues")
      .updateOne(
        { _id: new ObjectId(params.queueId) },
        { $set: { players: queue.players.slice(teamSize * 2) } }
      );

    // After creating the match, remove active players from all other queues
    const activePlayerIds = team1.map(
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
