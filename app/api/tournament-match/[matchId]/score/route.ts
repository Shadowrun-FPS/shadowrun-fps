import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity, validateBody } from "@/lib/api-wrapper";
import { revalidatePath } from "next/cache";

async function postMatchScoreHandler(
  request: NextRequest,
  { params }: { params: { matchId: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const matchId = sanitizeString(params.matchId, 200);
  const body = await request.json();
  const validation = validateBody(body, {
    mapIndex: { type: "number", required: true, min: 0 },
    teamAScore: { type: "number", required: true, min: 0, max: 6 },
    teamBScore: { type: "number", required: true, min: 0, max: 6 },
  });

  if (!validation.valid) {
    return NextResponse.json(
      { error: validation.errors?.join(", ") || "Invalid input" },
      { status: 400 }
    );
  }

  const { mapIndex, teamAScore, teamBScore } = validation.data! as {
    mapIndex: number;
    teamAScore: number;
    teamBScore: number;
  };

  if (teamAScore === 6 && teamBScore === 6) {
    return NextResponse.json(
      { error: "Both teams cannot have 6 rounds" },
      { status: 400 }
    );
  }

    const client = await clientPromise;
    const db = client.db();

    // Extract tournament ID from the match ID
    const tournamentId = matchId.split("-R")[0];

    // Find the tournament
    const tournament = await db.collection("Tournaments").findOne({
      _id: new ObjectId(tournamentId),
    });

    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }

    // Find the match in the tournament
    const matchIndex = tournament.tournamentMatches.findIndex(
      (m: any) => m.tournamentMatchId === matchId
    );

    if (matchIndex === -1) {
      return NextResponse.json(
        { error: "Match not found in tournament" },
        { status: 404 }
      );
    }

    // Update or add the map score
    const match = tournament.tournamentMatches[matchIndex];
    if (!match.mapScores) {
      match.mapScores = [];
    }

    // Initialize mapScores array if needed
    while (match.mapScores.length <= mapIndex) {
      match.mapScores.push(null);
    }

    match.mapScores[mapIndex] = {
      teamAScore,
      teamBScore,
      winner:
        teamAScore > teamBScore
          ? "teamA"
          : teamBScore > teamAScore
          ? "teamB"
          : "tie",
    };

    // Check if match is complete (best of 3)
    const teamAWins = match.mapScores.filter(
      (score: any) => score && score.winner === "teamA"
    ).length;

    const teamBWins = match.mapScores.filter(
      (score: any) => score && score.winner === "teamB"
    ).length;

    if (teamAWins >= 2 || teamBWins >= 2) {
      match.status = "completed";
      match.winner = teamAWins >= 2 ? "teamA" : "teamB";

      // If this is a tournament match, advance the winner
      if (match.roundIndex !== undefined && match.matchIndex !== undefined) {
        const nextRound = match.roundIndex + 1;
        const nextMatchIndex = Math.floor(match.matchIndex / 2);

        // Find the next match
        const nextMatchIdx = tournament.tournamentMatches.findIndex(
          (m: any) =>
            m.roundIndex === nextRound && m.matchIndex === nextMatchIndex
        );

        if (nextMatchIdx !== -1) {
          const nextMatch = tournament.tournamentMatches[nextMatchIdx];
          // Determine if the winner goes to teamA or teamB slot
          const isTeamASlot = match.matchIndex % 2 === 0;
          const winningTeam =
            match.winner === "teamA" ? match.teamA : match.teamB;

          // Update the next match with the winner
          if (isTeamASlot) {
            tournament.tournamentMatches[nextMatchIdx].teamA = winningTeam;
          } else {
            tournament.tournamentMatches[nextMatchIdx].teamB = winningTeam;
          }

          // If both teams are set, update the match status
          if (
            tournament.tournamentMatches[nextMatchIdx].teamA &&
            tournament.tournamentMatches[nextMatchIdx].teamB
          ) {
            tournament.tournamentMatches[nextMatchIdx].status = "upcoming";
          }
        }
      }
    }

    // Update the tournament
    await db
      .collection("Tournaments")
      .updateOne(
        { _id: new ObjectId(tournamentId) },
        { $set: { tournamentMatches: tournament.tournamentMatches } }
      );

    revalidatePath("/tournaments");
    revalidatePath(`/tournaments/match/${matchId}`);

    return NextResponse.json(match);
}

export const POST = withApiSecurity(postMatchScoreHandler, {
  rateLimiter: "api",
  requireAuth: true,
  revalidatePaths: ["/tournaments"],
});
