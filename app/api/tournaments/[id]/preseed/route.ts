import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// POST endpoint to pre-seed a tournament bracket
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    // Check authentication and admin permission
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be logged in to perform this action" },
        { status: 401 }
      );
    }

    // Check if user is admin
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

    // Get tournament with teams
    const tournament = await db.collection("Tournaments").findOne({
      _id: new ObjectId(id),
    });

    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }

    if (!tournament.teams || tournament.teams.length < 2) {
      return NextResponse.json(
        { error: "Tournament needs at least 2 teams to create a bracket" },
        { status: 400 }
      );
    }

    // Get full team data
    const teamIds = tournament.teams.map((teamId: string | ObjectId) =>
      typeof teamId === "string" ? new ObjectId(teamId) : teamId
    );

    const teams = await db
      .collection("Teams")
      .find({ _id: { $in: teamIds } })
      .toArray();

    if (teams.length === 0) {
      return NextResponse.json(
        { error: "No valid teams found" },
        { status: 400 }
      );
    }

    // Sort teams by ELO for proper seeding
    const registeredTeams = tournament.registeredTeams || [];

    // Sort teams by ELO (highest to lowest)
    const sortedTeams = [...registeredTeams].sort(
      (a, b) => (b.teamElo || 0) - (a.teamElo || 0)
    );

    // At the start of the POST handler, after basic validation
    // Check if the tournament has exactly the required number of teams
    const requiredTeamCount = tournament.maxTeams || 8;

    // Only allow pre-seeding when all team slots are filled
    if (tournament.registeredTeams.length !== requiredTeamCount) {
      return NextResponse.json(
        {
          success: false,
          message: `Pre-seeding requires exactly ${requiredTeamCount} teams (currently have ${tournament.registeredTeams.length})`,
        },
        { status: 400 }
      );
    }

    // Then continue with the existing valid team check
    const validTeams = sortedTeams.filter((team) => team && team._id);
    const uniqueTeamIds = new Set(validTeams.map((team) => team._id));

    // Ensure no team appears twice
    if (uniqueTeamIds.size !== validTeams.length) {
      return NextResponse.json(
        {
          success: false,
          message: "There are duplicate teams in the tournament",
        },
        { status: 400 }
      );
    }

    // Use validTeams instead of sortedTeams for the rest of the function
    const numTeams = validTeams.length;

    // Create first round matches with proper seeding
    const matches = [];
    const numMatches = Math.floor(numTeams / 2);
    if (numMatches < 1) {
      // If we don't have at least 2 teams, create an empty bracket
      return NextResponse.json(
        {
          success: false,
          message: "Not enough teams to create a bracket (minimum 2)",
        },
        { status: 400 }
      );
    }

    // Create a Set to track teams already used in matchups
    const usedTeamIds = new Set();

    // Standard tournament seeding pattern: 1 vs 8, 2 vs 7, 3 vs 6, 4 vs 5
    for (let i = 0; i < Math.floor(numTeams / 2); i++) {
      const topSeed = i;
      const bottomSeed = numTeams - 1 - i;

      // Get the teams
      const teamA = validTeams[topSeed];
      const teamB = validTeams[bottomSeed];

      // Skip if either team is undefined or already used
      if (
        !teamA ||
        !teamB ||
        usedTeamIds.has(teamA._id) ||
        usedTeamIds.has(teamB._id) ||
        teamA._id === teamB._id // Prevent same team from being matched with itself
      ) {
        console.log("Skipping match creation - invalid team pairing");
        continue;
      }

      // Mark teams as used
      usedTeamIds.add(teamA._id);
      usedTeamIds.add(teamB._id);

      // Create the match
      matches.push({
        matchId: `1-${i + 1}`,
        teamA,
        teamB,
        scores: { teamA: 0, teamB: 0 },
        status: "upcoming",
      });
    }

    const firstRound = {
      name: "Round 1",
      matches,
    };

    // Now we update each match with a proper matchId
    firstRound.matches.forEach((match, index) => {
      // Add matchId that can be referenced before tournament is launched
      match.matchId = `${id}-r1-m${index + 1}`;

      // For debugging, add seed info
      if (match.teamA) match.teamA.seed = index + 1;
      if (match.teamB) match.teamB.seed = numTeams - index;
    });

    // Generate subsequent rounds with empty matches
    const roundCount = Math.ceil(Math.log2(validTeams.length));
    const rounds = [];
    rounds.push(firstRound);

    for (let i = 1; i < roundCount; i++) {
      const matchCount = Math.pow(2, roundCount - i - 1);
      const matches = [];

      for (let j = 0; j < matchCount; j++) {
        matches.push({
          matchId: `${i + 1}-${j + 1}`,
          scores: { teamA: 0, teamB: 0 },
          status: "upcoming",
        });
      }

      rounds.push({
        name: `Round ${i + 1}`,
        matches,
      });
    }

    // Update tournament with seeded brackets
    await db.collection("Tournaments").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          brackets: { rounds },
          updatedAt: new Date(),
        },
      }
    );

    // Update the admin check to include your Discord ID for testing
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

    return NextResponse.json({
      success: true,
      message: "Tournament bracket has been pre-seeded",
    });
  } catch (error) {
    console.error("Error pre-seeding tournament:", error);
    return NextResponse.json(
      { error: "Failed to pre-seed tournament" },
      { status: 500 }
    );
  }
}
