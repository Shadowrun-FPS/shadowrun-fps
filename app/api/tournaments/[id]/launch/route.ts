import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ObjectId } from "mongodb";
import { SECURITY_CONFIG } from "@/lib/security-config";
import { canManageTournament } from "@/lib/tournament-permissions";

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
    // Validate admin permissions
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const { db } = await connectToDatabase();

    // Get the full tournament data
    const tournament = await db.collection("Tournaments").findOne({
      _id: new ObjectId(id),
    });

    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }

    // Check if user can manage this tournament (admin, creator, or co-host)
    const userRoles = session.user.roles || [];
    if (!canManageTournament(session.user.id, userRoles, tournament as any)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if tournament is already active
    if (tournament.status === "active") {
      return NextResponse.json(
        { error: "Tournament is already active" },
        { status: 400 }
      );
    }

    // Verify we have registered teams
    if (
      !tournament.registeredTeams ||
      tournament.registeredTeams.length === 0
    ) {
      return NextResponse.json(
        { error: "No teams registered for this tournament" },
        { status: 400 }
      );
    }

    // Check if the bracket has been seeded
    if (!tournament.brackets?.rounds?.[0]?.matches) {
      return NextResponse.json(
        { error: "Tournament bracket has not been seeded yet" },
        { status: 400 }
      );
    }

    // Get all ranked maps from the Maps collection
    const rankedMaps = await db
      .collection("Maps")
      .find({ rankedMap: true })
      .toArray();

    // Prepare maps array with both regular and small variants
    const allMapsWithVariants: any[] = [];

    rankedMaps.forEach((map: any) => {
      // Add the regular map
      allMapsWithVariants.push({
        _id: map._id,
        name: map.name,
        gameMode: map.gameMode,
        src: map.src,
        isSmall: false,
      });

      // If smallOption is true, add a small variant
      if (map.smallOption) {
        allMapsWithVariants.push({
          _id: map._id,
          name: `${map.name} (Small)`,
          gameMode: map.gameMode,
          src: map.src,
          isSmall: true,
        });
      }
    });

    // Helper function to randomly select 3 maps
    const selectRandomMaps = (): any[] => {
      if (!allMapsWithVariants || allMapsWithVariants.length === 0) {
        // Return some default maps if none available
        return [
          {
            mapName: "Map 1",
            mapImage: "/maps/map_default.png",
            gameMode: "Attrition",
          },
          {
            mapName: "Map 2",
            mapImage: "/maps/map_default.png",
            gameMode: "Attrition",
          },
          {
            mapName: "Map 3",
            mapImage: "/maps/map_default.png",
            gameMode: "Attrition",
          },
        ];
      }

      // Shuffle the maps array
      const shuffled = [...allMapsWithVariants].sort(() => 0.5 - Math.random());

      // Take 3 random maps
      return shuffled.slice(0, Math.min(3, shuffled.length)).map((map) => ({
        mapName: map.name,
        mapImage: map.src,
        gameMode: map.gameMode,
        isSmall: map.isSmall,
      }));
    };

    // Create tournament matches for the first round
    const tournamentMatches = [];

    // For each match in the first round
    for (let i = 0; i < tournament.brackets.rounds[0].matches.length; i++) {
      const bracketMatch = tournament.brackets.rounds[0].matches[i];

      // Only create matches for both teams assigned
      if (bracketMatch.teamA && bracketMatch.teamB) {
        // Find the full team objects
        const teamA = tournament.registeredTeams.find(
          (t: any) => t._id.toString() === bracketMatch.teamA._id.toString()
        );

        const teamB = tournament.registeredTeams.find(
          (t: any) => t._id.toString() === bracketMatch.teamB._id.toString()
        );

        if (teamA && teamB) {
          const matchId = `${tournament._id.toString()}-R1-M${i + 1}`;

          // Select random maps for this match
          const matchMaps = selectRandomMaps();

          // Create the match object
          tournamentMatches.push({
            tournamentMatchId: matchId,
            teamA: teamA,
            teamB: teamB,
            status: "live",
            maps: matchMaps,
            mapScores: [],
            winner: null,
            round: 1,
            matchNumber: i + 1,
            createdAt: new Date(),
            startTime: new Date(),
          });

          // Update the bracket with match ID
          await db.collection("Tournaments").updateOne(
            { _id: new ObjectId(id) },
            {
              $set: {
                [`brackets.rounds.0.matches.${i}.status`]: "live",
                [`brackets.rounds.0.matches.${i}.tournamentMatchId`]: matchId,
              },
            }
          );
        }
      }
    }

    // Update tournament status and add match records
    await db.collection("Tournaments").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          status: "active",
          tournamentMatches: tournamentMatches,
          launchedAt: new Date(),
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
