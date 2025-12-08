import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { SECURITY_CONFIG } from "@/lib/security-config";
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity } from "@/lib/api-wrapper";
import { revalidatePath } from "next/cache";

async function postClearTournamentHandler(
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

  const id = sanitizeString(params.id, 50);
  if (!ObjectId.isValid(id)) {
    return NextResponse.json(
      { error: "Invalid tournament ID" },
      { status: 400 }
    );
  }

  const client = await clientPromise;
  const db = client.db();

  const user = await db.collection("Users").findOne({
    discordId: session.user.id,
  });

    // Add tournament fetch to clear endpoint
    const tournament = await db.collection("Tournaments").findOne({
      _id: new ObjectId(id),
    });

    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }

    // Update admin check to include your specific ID for testing
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

    // Clear teams from tournament
    await db.collection("Tournaments").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          teams: [],
          registeredTeams: [],
          "brackets.rounds": [
            {
              name: "Round 1",
              matches: [],
            },
          ],
          updatedAt: new Date(),
        },
      }
    );

    revalidatePath("/tournaments");
    revalidatePath(`/tournaments/${id}`);

    return NextResponse.json({
      success: true,
      message: "All teams removed from tournament",
    });
}

export const POST = withApiSecurity(postClearTournamentHandler, {
  rateLimiter: "admin",
  requireAuth: true,
  requireAdmin: true,
  revalidatePaths: ["/tournaments"],
});
