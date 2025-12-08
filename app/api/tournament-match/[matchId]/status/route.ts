import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity, validateBody } from "@/lib/api-wrapper";
import { revalidatePath } from "next/cache";

async function patchMatchStatusHandler(
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
    status: {
      type: "string",
      required: true,
      pattern: /^(upcoming|in_progress|completed)$/,
    },
  });

  if (!validation.valid) {
    return NextResponse.json(
      { error: validation.errors?.join(", ") || "Invalid status value" },
      { status: 400 }
    );
  }

  const { status } = validation.data! as { status: string };

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

    // Update the match status
    tournament.tournamentMatches[matchIndex].status = status;

    // Update the tournament
    await db
      .collection("Tournaments")
      .updateOne(
        { _id: new ObjectId(tournamentId) },
        { $set: { [`tournamentMatches.${matchIndex}.status`]: status } }
      );

    revalidatePath("/tournaments");
    revalidatePath(`/tournaments/match/${matchId}`);

    return NextResponse.json(tournament.tournamentMatches[matchIndex]);
}

export const PATCH = withApiSecurity(patchMatchStatusHandler, {
  rateLimiter: "api",
  requireAuth: true,
  revalidatePaths: ["/tournaments"],
});
