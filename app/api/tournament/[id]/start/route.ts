import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity } from "@/lib/api-wrapper";
import { revalidatePath } from "next/cache";

async function postStartTournamentHandler(
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

    const client = await clientPromise;
    const db = client.db();

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

    safeLog.log("Starting tournament", { tournamentId });

    const updatedTournament = { ...tournament };
    const newStatus = "in_progress";

    updatedTournament.status = newStatus;

    if (
      updatedTournament.tournamentMatches &&
      Array.isArray(updatedTournament.tournamentMatches)
    ) {
      updatedTournament.tournamentMatches =
        updatedTournament.tournamentMatches.map((match) => {
          if (match.roundIndex === 0) {
            return { ...match, status: newStatus };
          }
          return match;
        });
    }

    if (
      updatedTournament.brackets &&
      updatedTournament.brackets.rounds &&
      Array.isArray(updatedTournament.brackets.rounds) &&
      updatedTournament.brackets.rounds[0] &&
      updatedTournament.brackets.rounds[0].matches &&
      Array.isArray(updatedTournament.brackets.rounds[0].matches)
    ) {
      updatedTournament.brackets.rounds[0].matches =
        updatedTournament.brackets.rounds[0].matches.map(
          (match: { matchId: any; tournamentMatchId: any }) => {
            return { ...match, status: newStatus };
          }
        );
    }

    await db
      .collection("Tournaments")
      .replaceOne({ _id: new ObjectId(tournamentId) }, updatedTournament);

    revalidatePath("/tournaments");
    revalidatePath(`/tournaments/${tournamentId}`);

    return NextResponse.json({
      success: true,
      message: "Tournament started successfully",
      updatedTournament: {
        ...updatedTournament,
        _id: updatedTournament._id.toString(),
      },
    });
}

export const POST = withApiSecurity(postStartTournamentHandler, {
  rateLimiter: "admin",
  requireAuth: true,
  requireAdmin: true,
  revalidatePaths: ["/tournaments"],
});
