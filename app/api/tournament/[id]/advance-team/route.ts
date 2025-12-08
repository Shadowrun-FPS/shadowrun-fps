import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity, validateBody } from "@/lib/api-wrapper";
import { revalidatePath } from "next/cache";

async function postAdvanceTeamHandler(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user || !session.user.roles?.includes("admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tournamentId = sanitizeString(params.id, 50);
  if (!ObjectId.isValid(tournamentId)) {
    return NextResponse.json(
      { error: "Invalid tournament ID" },
      { status: 400 }
    );
  }

  const body = await request.json();
  const validation = validateBody(body, {
    matchId: { type: "string", required: true, maxLength: 100 },
    winnerId: { type: "string", required: true, maxLength: 50 },
  });

  if (!validation.valid) {
    return NextResponse.json(
      { error: validation.errors?.join(", ") || "Match ID and winner ID are required" },
      { status: 400 }
    );
  }

  const { matchId, winnerId } = validation.data! as {
    matchId: string;
    winnerId: string;
  };

  const sanitizedMatchId = sanitizeString(matchId, 100);
  const sanitizedWinnerId = sanitizeString(winnerId, 50);

    const client = await clientPromise;
    const db = client.db();

    const tournament = await db.collection("Tournaments").findOne({
      _id: new ObjectId(tournamentId),
    });

    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }

    const match = tournament.tournamentMatches.find(
      (m: any) => m.tournamentMatchId === sanitizedMatchId
    );

    if (!match) {
      return NextResponse.json(
        { error: "Match not found in tournament" },
        { status: 404 }
      );
    }

    const winnerTeam = match.teamA._id === sanitizedWinnerId ? "teamA" : "teamB";

    // Update the match with the winner
    match.status = "completed";
    match.winner = winnerTeam;

    // Find the next match in the next round
    const currentRound = match.roundIndex;
    const currentMatchIndex = match.matchIndex;
    const nextRound = currentRound + 1;
    const nextMatchIndex = Math.floor(currentMatchIndex / 2);

    // Find the next match
    const nextMatch = tournament.tournamentMatches.find(
      (m: any) => m.roundIndex === nextRound && m.matchIndex === nextMatchIndex
    );

    if (nextMatch) {
      // Determine if the winner goes to teamA or teamB slot
      const isTeamASlot = currentMatchIndex % 2 === 0;

      // Get the winning team object
      const winningTeam = winnerTeam === "teamA" ? match.teamA : match.teamB;

      // Update the next match with the winner
      if (isTeamASlot) {
        nextMatch.teamA = winningTeam;
      } else {
        nextMatch.teamB = winningTeam;
      }

      // If both teams are set, update the match status
      if (nextMatch.teamA && nextMatch.teamB) {
        nextMatch.status = "upcoming";
      }
    }

    await db
      .collection("Tournaments")
      .updateOne(
        { _id: new ObjectId(tournamentId) },
        { $set: { tournamentMatches: tournament.tournamentMatches } }
      );

    revalidatePath("/tournaments");
    revalidatePath(`/tournaments/${tournamentId}`);

    return NextResponse.json({
      success: true,
      message: "Team advanced successfully",
    });
}

export const POST = withApiSecurity(postAdvanceTeamHandler, {
  rateLimiter: "admin",
  requireAuth: true,
  requireAdmin: true,
  revalidatePaths: ["/tournaments"],
});
