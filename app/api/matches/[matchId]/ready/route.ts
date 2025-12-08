import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { authOptions } from "@/lib/auth";
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity } from "@/lib/api-wrapper";
import { revalidatePath } from "next/cache";

async function postMatchReadyHandler(
  req: NextRequest,
  { params }: { params: { matchId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const matchId = sanitizeString(params.matchId, 100);
  if (!ObjectId.isValid(matchId)) {
    return NextResponse.json(
      { error: "Invalid match ID" },
      { status: 400 }
    );
  }

  const userId = sanitizeString(session.user.id, 50);
  const client = await clientPromise;
  const db = client.db("ShadowrunWeb");

  const result = await db.collection("Matches").findOneAndUpdate(
    {
      _id: new ObjectId(matchId),
      $or: [
        { "teams.teamA.discordId": userId },
        { "teams.teamB.discordId": userId },
      ],
    },
      {
        $set: {
          [`teams.$[player].ready`]: true,
        },
      },
    {
      arrayFilters: [{ "player.discordId": userId }],
      returnDocument: "after",
    }
  );

    if (!result) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    const match = result.value;
    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    // Check if all players are ready
    const allPlayersReady = [...match.teams.teamA, ...match.teams.teamB].every(
      (player) => player.ready
    );

  if (allPlayersReady) {
    await db
      .collection("Matches")
      .updateOne(
        { _id: new ObjectId(matchId) },
        { $set: { status: "in-progress" } }
      );
  }

  revalidatePath("/matches");
  revalidatePath(`/matches/${matchId}`);

  return NextResponse.json({ success: true, match });
}

export const POST = withApiSecurity(postMatchReadyHandler, {
  rateLimiter: "api",
  requireAuth: true,
  revalidatePaths: ["/matches"],
});
