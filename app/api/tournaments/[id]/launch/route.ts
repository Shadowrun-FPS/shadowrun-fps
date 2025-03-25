import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { nanoid } from "nanoid";

// First, add a proper interface for tournament matches
interface TournamentMatch {
  tournamentMatchId: string;
  tournamentId: string;
  roundIndex: number;
  matchIndex: number;
  teamA?: { _id: string; name: string; tag: string };
  teamB?: { _id: string; name: string; tag: string };
  status: "upcoming" | "in_progress" | "completed";
  winner?: "teamA" | "teamB";
  mapScores?: Array<{
    mapName: string;
    teamAScore: number;
    teamBScore: number;
  }>;
  createdAt?: Date;
  maps?: Array<{ mapName: string; gameMode: string }>;
}

// Add interface for the Match type
interface Match {
  teamA?: { _id: string; name: string; tag: string };
  teamB?: { _id: string; name: string; tag: string };
  tournamentMatchId?: string;
  status?: "upcoming" | "live" | "completed";
  scores?: {
    teamA: number;
    teamB: number;
  };
  winner?: "teamA" | "teamB" | "draw";
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    // Check authentication
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be logged in to perform this action" },
        { status: 401 }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    const user = await db.collection("Users").findOne({
      discordId: session.user.id,
    });

    const { id } = params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid tournament ID" },
        { status: 400 }
      );
    }

    // Get tournament
    const tournament = await db.collection("Tournaments").findOne({
      _id: new ObjectId(id),
    });

    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }

    // Check admin permissions
    const isAdmin =
      user?.roles?.includes("admin") ||
      tournament.createdBy?.discordId === session.user.id ||
      session.user.id === "238329746671271936" || // Add your specific ID for testing
      false;

    if (!isAdmin) {
      return NextResponse.json(
        { error: "You must be an administrator to perform this action" },
        { status: 403 }
      );
    }

    // Check if the tournament has the required number of teams
    if (tournament.registeredTeams.length !== (tournament.maxTeams || 8)) {
      return NextResponse.json(
        { error: "Tournament doesn't have the required number of teams" },
        { status: 400 }
      );
    }

    // Check if tournament is already active or completed
    if (tournament.status !== "upcoming") {
      return NextResponse.json(
        { error: "Tournament is already launched" },
        { status: 400 }
      );
    }

    // Get maps for tournament
    const allMaps = await db
      .collection("Maps")
      .find({ rankedMap: true })
      .toArray();

    if (!allMaps || allMaps.length === 0) {
      return NextResponse.json(
        { error: "No ranked maps found in the database" },
        { status: 500 }
      );
    }

    // Create the expanded map pool with small variants
    const mapPool = allMaps.flatMap((map) => {
      const maps = [
        {
          mapName: map.name,
          gameMode: map.gameMode,
        },
      ];

      if (map.smallOption) {
        maps.push({
          mapName: `${map.name} (Small)`,
          gameMode: map.gameMode,
        });
      }

      return maps;
    });

    // Generate tournament matches for first round
    const tournamentMatches: TournamentMatch[] = [];

    if (tournament.brackets?.rounds && tournament.brackets.rounds.length > 0) {
      const firstRound = tournament.brackets.rounds[0];

      firstRound.matches.forEach((match: Match, index: number) => {
        if (match.teamA && match.teamB) {
          // Ensure unique and consistent match ID
          const tournamentMatchId = `${tournament._id.toString()}-R1-M${
            index + 1
          }`;

          // Select 3 random maps from the pool without duplicates
          const selectedMaps = [];
          const mapPoolCopy = [...mapPool];

          for (let i = 0; i < 3; i++) {
            if (mapPoolCopy.length === 0) break;

            const randomIndex = Math.floor(Math.random() * mapPoolCopy.length);
            selectedMaps.push(mapPoolCopy[randomIndex]);
            mapPoolCopy.splice(randomIndex, 1);
          }

          // Update match and create tournament match entry
          match.tournamentMatchId = tournamentMatchId;

          tournamentMatches.push({
            tournamentMatchId,
            tournamentId: tournament._id.toString(),
            roundIndex: 0,
            matchIndex: index,
            teamA: match.teamA,
            teamB: match.teamB,
            mapScores: [],
            status: "upcoming",
            createdAt: new Date(),
            maps: selectedMaps,
          });
        }
      });
    }

    // Update tournament with match IDs and set status to active
    await db.collection("Tournaments").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          status: "active",
          updatedAt: new Date(),
          "brackets.rounds": tournament.brackets?.rounds,
          tournamentMatches,
        },
      }
    );

    return NextResponse.json({
      success: true,
      message: "Tournament launched successfully",
    });
  } catch (error) {
    console.error("Error launching tournament:", error);
    return NextResponse.json(
      { error: "Failed to launch tournament" },
      { status: 500 }
    );
  }
}
