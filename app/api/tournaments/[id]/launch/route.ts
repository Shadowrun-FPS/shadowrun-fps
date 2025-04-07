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
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    if (!session.user.isAdmin) {
      return NextResponse.json(
        { error: "Only admins can launch tournaments" },
        { status: 403 }
      );
    }

    const { id } = params;

    const client = await clientPromise;
    const db = client.db();

    // Validate tournament ID
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

    // Check if tournament is already active
    if (tournament.status === "active") {
      return NextResponse.json(
        { error: "Tournament is already active" },
        { status: 400 }
      );
    }

    // First update existing tournament if it's already set up
    const updateResult = await db.collection("Tournaments").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          status: "active",
          startedAt: new Date(),
          "brackets.rounds.0.matches.$[].status": "live",
          "tournamentMatches.$[firstRoundMatch].status": "live",
        },
      },
      {
        arrayFilters: [{ "firstRoundMatch.roundIndex": 0 }],
      }
    );

    const tournamentMatches = [];

    if (tournament.brackets && tournament.brackets.rounds) {
      const firstRound = tournament.brackets.rounds[0];

      // Process each match in the first round
      for (let index = 0; index < firstRound.matches.length; index++) {
        const match = firstRound.matches[index];

        if (match.teamA && match.teamB) {
          // Ensure unique and consistent match ID
          const tournamentMatchId = `${tournament._id.toString()}-R1-M${
            index + 1
          }`;

          // Update match with tournamentMatchId
          match.tournamentMatchId = tournamentMatchId;

          // Get random ranked maps from the Maps collection
          const rankedMaps = await db
            .collection("Maps")
            .find({ rankedMap: true })
            .toArray();

          // Randomly select 3 maps
          const shuffledMaps = rankedMaps.sort(() => 0.5 - Math.random());
          const selectedMaps = shuffledMaps.slice(0, 3).map((map) => {
            // Randomly decide if we should use small version (if available)
            const useSmallVersion = map.smallOption && Math.random() > 0.5;

            return {
              mapName: useSmallVersion ? `${map.name} (Small)` : map.name,
              gameMode: map.gameMode,
              smallOption: useSmallVersion,
            };
          });

          // Create tournament match object - SET STATUS TO LIVE HERE
          tournamentMatches.push({
            tournamentMatchId,
            tournamentId: tournament._id.toString(),
            roundIndex: 0,
            matchIndex: index,
            teamA: match.teamA,
            teamB: match.teamB,
            mapScores: [],
            status: "live", // <-- CHANGED FROM "upcoming" TO "live"
            createdAt: new Date(),
            maps: selectedMaps,
          });
        }
      }

      // Only update if we have new matches to add
      if (tournamentMatches.length > 0) {
        await db.collection("Tournaments").updateOne(
          { _id: new ObjectId(id) },
          {
            $set: {
              tournamentMatches,
              "brackets.rounds.0.matches.$[].status": "live",
            },
          }
        );
      }
    }

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
