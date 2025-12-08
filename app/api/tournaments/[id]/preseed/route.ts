import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { SECURITY_CONFIG, hasAdminRole } from "@/lib/security-config";
import { canManageTournament } from "@/lib/tournament-permissions";
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity } from "@/lib/api-wrapper";
import { revalidatePath } from "next/cache";

async function postPreseedTournamentHandler(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json(
      { error: "You must be logged in to perform this action" },
      { status: 401 }
    );
  }

  const tournamentId = sanitizeString(params.id, 50);
  if (!ObjectId.isValid(tournamentId)) {
    return NextResponse.json(
      { error: "Invalid tournament ID" },
      { status: 400 }
    );
  }

  const client = await clientPromise;
  const db = client.db();

  const user = await db.collection("Users").findOne({
    discordId: sanitizeString(session.user.id, 50),
  });

    const tournament = await db.collection("Tournaments").findOne({
      _id: new ObjectId(tournamentId),
    });

    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }

    // Check if tournament has registered teams
    if (!tournament.registeredTeams || tournament.registeredTeams.length < 2) {
      return NextResponse.json(
        { error: "Tournament needs at least 2 registered teams to create a bracket" },
        { status: 400 }
      );
    }

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

    // Sort teams by ELO for proper seeding (highest ELO = seed 1, lowest ELO = last seed)
    const registeredTeams = tournament.registeredTeams || [];

    // Get team IDs from registeredTeams to fetch full team data
    const { getAllTeamCollectionNames } = await import("@/lib/team-collections");
    const teamIds = registeredTeams
      .map((team: any): ObjectId | null => {
        if (typeof team === "object" && team._id) {
          return typeof team._id === "string" ? new ObjectId(team._id) : team._id;
        }
        return null;
      })
      .filter((id: ObjectId | null): id is ObjectId => id !== null);

    const allCollections = getAllTeamCollectionNames();
    const teams = [];
    for (const collectionName of allCollections) {
      const collectionTeams = await db
        .collection(collectionName)
        .find({ _id: { $in: teamIds } })
        .toArray();
      teams.push(...collectionTeams);
    }

    if (teams.length === 0) {
      return NextResponse.json(
        { error: "No valid teams found" },
        { status: 400 }
      );
    }

    // Sort teams by ELO (highest to lowest) - highest ELO gets seed 1
    const sortedTeams = [...registeredTeams].sort(
      (a, b) => (b.teamElo || 0) - (a.teamElo || 0)
    );

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
    // validTeams is sorted highest ELO to lowest ELO
    // validTeams[0] = highest ELO = seed 1
    // validTeams[7] = lowest ELO = seed 8
    for (let i = 0; i < Math.floor(numTeams / 2); i++) {
      const topSeedIndex = i; // Index in sorted array (0 = highest ELO = seed 1)
      const bottomSeedIndex = numTeams - 1 - i; // Index in sorted array (7 = lowest ELO = seed 8)

      // Get the teams - teamA gets the higher seed (lower index = higher ELO)
      const teamA = validTeams[topSeedIndex]; // Higher ELO team
      const teamB = validTeams[bottomSeedIndex]; // Lower ELO team

      // Skip if either team is undefined or already used
      if (
        !teamA ||
        !teamB ||
        usedTeamIds.has(teamA._id) ||
        usedTeamIds.has(teamB._id) ||
        teamA._id === teamB._id
      ) {
        safeLog.warn("Skipping match creation - invalid team pairing", {
          tournamentId,
          teamA: teamA?._id,
          teamB: teamB?._id,
        });
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

    // Now we update each match with a proper matchId and correct seed assignments
    // Match index 0: teamA = validTeams[0] (highest ELO) = seed 1, teamB = validTeams[7] (lowest ELO) = seed 8
    // Match index 1: teamA = validTeams[1] (2nd highest) = seed 2, teamB = validTeams[6] (2nd lowest) = seed 7
    // etc.
    firstRound.matches.forEach((match, index) => {
      // Add matchId that can be referenced before tournament is launched
      match.matchId = `${tournamentId}-r1-m${index + 1}`;

      // Assign seeds correctly: teamA is from higher position in sorted array (lower index = higher ELO = lower seed number)
      // teamB is from lower position in sorted array (higher index = lower ELO = higher seed number)
      if (match.teamA) {
        match.teamA.seed = index + 1; // Seed 1, 2, 3, 4... (highest ELO teams)
      }
      if (match.teamB) {
        match.teamB.seed = numTeams - index; // Seed 8, 7, 6, 5... (lowest ELO teams)
      }
    });

    // Generate subsequent rounds with empty matches
    const baseRoundCount = Math.ceil(Math.log2(validTeams.length)); // For 8 teams: 3 rounds
    const rounds = [];
    rounds.push(firstRound);

    // Create the standard winners bracket rounds (WR1, WR2, WR3 for 8 teams)
    for (let i = 1; i < baseRoundCount; i++) {
      const matchCount = Math.pow(2, baseRoundCount - i - 1);
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

    // For double elimination, add Grand Finals (WR4) and potential Decisive Match (WR5)
    if (tournament.format === "double_elimination") {
      // Round 4: Grand Finals (Winners Bracket Champion vs Losers Bracket Champion)
      rounds.push({
        name: "Round 4 (Grand Finals)",
        matches: [
          {
            matchId: `${baseRoundCount + 1}-1`,
            scores: { teamA: 0, teamB: 0 },
            status: "upcoming",
          },
        ],
      });

      // Round 5: Decisive Match (only if losers bracket champion wins WR4)
      // Create it empty - it will be populated if needed
      rounds.push({
        name: "Round 5 (Decisive Match)",
        matches: [
          {
            matchId: `${baseRoundCount + 2}-1`,
            scores: { teamA: 0, teamB: 0 },
            status: "upcoming",
          },
        ],
      });
    }

    // For double elimination, create losers bracket rounds
    let losersRounds: any[] = [];
    if (tournament.format === "double_elimination") {
      // Losers bracket structure for double elimination
      // Pattern:
      // - LR1: numTeams / 4 matches (losers from WR1)
      // - LR2: numTeams / 4 matches (winners from LR1 + losers from WR2)
      // - LR3 to LR(baseRoundCount-1): Alternating pattern
      // - LR(baseRoundCount): 1 match (winner from previous + loser from WR(baseRoundCount))
      // - LR(baseRoundCount+1): 1 match (winner from LR(baseRoundCount) + loser from Grand Finals)
      const losersRoundCount = baseRoundCount + 1;

      for (let i = 0; i < losersRoundCount; i++) {
        let matchCount = 0;

        if (i === 0) {
          // First losers round: pairs up losers from first winners round
          // For 4 teams: 1 match, 8 teams: 2 matches, 16 teams: 4 matches, etc.
          matchCount = Math.floor(numTeams / 4);
        } else if (i === 1) {
          // Second losers round: winners from LR1 + losers from WR2
          // Same count as LR1
          matchCount = Math.floor(numTeams / 4);
        } else if (i < baseRoundCount - 1) {
          // Middle losers rounds (LR3, LR4, etc. up to LR(baseRoundCount-1))
          // Pattern: Each round has half the matches of the previous round
          // LR3: numTeams / 8, LR4: numTeams / 16, etc.
          const divisor = Math.pow(2, i + 2); // 2^5=32 for LR3, 2^6=64 for LR4, etc.
          matchCount = Math.max(1, Math.floor(numTeams / divisor));
        } else if (i === baseRoundCount - 1) {
          // Second-to-last losers round: winner from previous LR + loser from WR(baseRoundCount)
          // This is the round before the losers bracket final
          matchCount = 1;
        } else if (i === baseRoundCount) {
          // Last losers round: winner from previous LR + loser from Grand Finals
          // This determines the losers bracket champion
          matchCount = 1;
        }

        // Only create rounds with matches
        if (matchCount > 0) {
          const matches = [];
          for (let j = 0; j < matchCount; j++) {
            matches.push({
              matchId: `L${i + 1}-${j + 1}`,
              scores: { teamA: 0, teamB: 0 },
              status: "upcoming",
            });
          }

          losersRounds.push({
            name: `Losers Round ${i + 1}`,
            matches,
          });
        }
      }
    }

    // Extract ObjectIds from registeredTeams and add them to teams array
    const registeredTeamIds = validTeams.map((team: any) => new ObjectId(team._id));

    const userRoles = user?.roles || [];
    if (!canManageTournament(session.user.id, userRoles, tournament as any)) {
      return NextResponse.json(
        {
          error:
            "You must be an administrator, tournament creator, or co-host to perform this action",
        },
        { status: 403 }
      );
    }

    await db.collection("Tournaments").updateOne(
      { _id: new ObjectId(tournamentId) },
      {
        $set: {
          brackets: {
            rounds,
            ...(tournament.format === "double_elimination" && { losersRounds }),
          },
          teams: registeredTeamIds,
          updatedAt: new Date(),
        },
      }
    );

    revalidatePath("/tournaments");
    revalidatePath(`/tournaments/${tournamentId}`);

    return NextResponse.json({
      success: true,
      message: "Tournament bracket has been pre-seeded",
    });
}

export const POST = withApiSecurity(postPreseedTournamentHandler, {
  rateLimiter: "admin",
  requireAuth: true,
  revalidatePaths: ["/tournaments"],
});
