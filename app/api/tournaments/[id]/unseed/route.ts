import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { SECURITY_CONFIG } from "@/lib/security-config";
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity } from "@/lib/api-wrapper";
import { revalidatePath } from "next/cache";

async function postUnseedTournamentHandler(
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

    // Check if the tournament is already launched
    if (tournament.status !== "upcoming") {
      return NextResponse.json(
        { error: "Cannot undo seeding after tournament has started" },
        { status: 400 }
      );
    }

    // Update the admin check to include your specific ID for testing
    const isAdmin =
      user?.roles?.includes("admin") ||
      tournament.createdBy?.discordId === session.user.id ||
      session?.user?.id === SECURITY_CONFIG.DEVELOPER_ID ||
      false;

    if (!isAdmin) {
      return NextResponse.json(
        { error: "You must be an administrator to perform this action" },
        { status: 403 }
      );
    }

    // Create empty rounds structure
    const emptyRounds = [
      {
        name: "Round 1",
        matches: [],
      },
    ];

    await db.collection("Tournaments").updateOne(
      { _id: new ObjectId(tournamentId) },
      {
        $set: {
          "brackets.rounds": emptyRounds,
          teams: [],
          updatedAt: new Date(),
        },
      }
    );

    revalidatePath("/tournaments");
    revalidatePath(`/tournaments/${tournamentId}`);

    return NextResponse.json({
      success: true,
      message: "Tournament seeding has been removed",
    });
}

export const POST = withApiSecurity(postUnseedTournamentHandler, {
  rateLimiter: "admin",
  requireAuth: true,
  revalidatePaths: ["/tournaments"],
});
