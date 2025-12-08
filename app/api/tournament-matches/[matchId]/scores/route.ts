import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity, validateBody } from "@/lib/api-wrapper";
import { revalidatePath } from "next/cache";

async function postMatchScoresHandler(
  request: NextRequest,
  { params }: { params: { matchId: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json(
      { error: "You must be logged in to submit scores" },
      { status: 401 }
    );
  }

  const matchId = sanitizeString(params.matchId, 200);
  const body = await request.json();
  const validation = validateBody(body, {
    mapIndex: { type: "number", required: true, min: 0 },
    teamAScore: { type: "number", required: true, min: 0, max: 6 },
    teamBScore: { type: "number", required: true, min: 0, max: 6 },
    submittedBy: {
      type: "string",
      required: true,
      pattern: /^(teamA|teamB)$/,
    },
  });

  if (!validation.valid) {
    return NextResponse.json(
      { error: validation.errors?.join(", ") || "Invalid input data" },
      { status: 400 }
    );
  }

  const { mapIndex, teamAScore, teamBScore, submittedBy } = validation.data! as {
    mapIndex: number;
    teamAScore: number;
    teamBScore: number;
    submittedBy: string;
  };

    const client = await clientPromise;
    const db = client.db();

    // Find the match
    const match = await db.collection("TournamentMatches").findOne({
      tournamentMatchId: matchId,
    });

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    const userId = sanitizeString(session.user.id, 50);
    const isTeamAMember = match.teamA?.members?.some(
      (m: any) => m.discordId === userId
    );
    const isTeamBMember = match.teamB?.members?.some(
      (m: any) => m.discordId === userId
    );

    if (
      (submittedBy === "teamA" && !isTeamAMember) ||
      (submittedBy === "teamB" && !isTeamBMember)
    ) {
      return NextResponse.json(
        { error: "You are not authorized to submit scores for this team" },
        { status: 403 }
      );
    }

    // Initialize or update map scores
    let mapScores = match.mapScores || [];

    // Extend array if needed
    while (mapScores.length <= mapIndex) {
      mapScores.push({});
    }

    // Update the scores for the submitting team
    const submissionField = `submittedBy${
      submittedBy === "teamA" ? "TeamA" : "TeamB"
    }`;

    mapScores[mapIndex] = {
      ...mapScores[mapIndex],
      [submittedBy === "teamA" ? "teamAScore" : "teamBScore"]:
        submittedBy === "teamA" ? teamAScore : teamBScore,
      [submittedBy === "teamA" ? "teamBScore" : "teamAScore"]:
        submittedBy === "teamA" ? teamBScore : teamAScore,
      [submissionField]: true,
    };

    // Check if both teams have submitted scores
    if (
      mapScores[mapIndex].submittedByTeamA &&
      mapScores[mapIndex].submittedByTeamB
    ) {
      // Determine winner of this map
      const winner =
        mapScores[mapIndex].teamAScore > mapScores[mapIndex].teamBScore
          ? "teamA"
          : "teamB";

      mapScores[mapIndex].winner = winner;

      // Count wins for each team
      const teamAWins = mapScores.filter(
        (score: { winner: string }) => score.winner === "teamA"
      ).length;
      const teamBWins = mapScores.filter(
        (score: { winner: string }) => score.winner === "teamB"
      ).length;

      // Check if match is complete (best of 3)
      if (teamAWins >= 2 || teamBWins >= 2) {
        const matchWinner = teamAWins >= 2 ? "teamA" : "teamB";

        // Update match with winner
        await db.collection("TournamentMatches").updateOne(
          { tournamentMatchId: matchId },
          {
            $set: {
              mapScores,
              status: "completed",
              winner: matchWinner,
            },
          }
        );

        // Update tournament bracket
        // This is complex and would need to be implemented based on your tournament structure

        return NextResponse.json({
          success: true,
          message: "Match completed",
          matchWinner,
        });
      }
    }

    // Update match with new scores
    await db.collection("TournamentMatches").updateOne(
      { tournamentMatchId: matchId },
      {
        $set: {
          mapScores,
          status: "in_progress",
        },
      }
    );

    revalidatePath("/tournaments");
    revalidatePath(`/tournaments/match/${matchId}`);

    return NextResponse.json({
      success: true,
      message: "Scores submitted successfully",
    });
}

export const POST = withApiSecurity(postMatchScoresHandler, {
  rateLimiter: "api",
  requireAuth: true,
  revalidatePaths: ["/tournaments"],
});
