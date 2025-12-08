import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity } from "@/lib/api-wrapper";
import { revalidatePath } from "next/cache";

async function postUndoSeedingHandler(
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

    // Clear team information from all matches
    const updatedMatches = tournament.tournamentMatches.map((match: any) => {
      return {
        ...match,
        teamA: null,
        teamB: null,
        winner: null,
        mapScores: [],
        status: "upcoming",
      };
    });

    // Update the tournament
    await db
      .collection("Tournaments")
      .updateOne(
        { _id: new ObjectId(tournamentId) },
        { $set: { tournamentMatches: updatedMatches } }
      );

    revalidatePath("/tournaments");
    revalidatePath(`/tournaments/${tournamentId}`);

    return NextResponse.json({
      success: true,
      message: "Teams unseeded successfully",
    });
}

export const POST = withApiSecurity(postUndoSeedingHandler, {
  rateLimiter: "admin",
  requireAuth: true,
  requireAdmin: true,
  revalidatePaths: ["/tournaments"],
});
