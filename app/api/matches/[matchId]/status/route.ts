import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import clientPromise from "@/lib/mongodb";
import { authOptions } from "@/lib/auth";
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity, validateBody } from "@/lib/api-wrapper";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

async function postStatusMatchHandler(
  req: NextRequest,
  { params }: { params: { matchId: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const matchId = sanitizeString(params.matchId, 100);

  const body = await req.json();
  const validation = validateBody(body, {
    status: { type: "string", required: true, maxLength: 50 },
  });

  if (!validation.valid) {
    return NextResponse.json(
      { error: validation.errors?.join(", ") || "Invalid input" },
      { status: 400 }
    );
  }

  const { status } = validation.data! as { status: string };

  if (!["draft", "in_progress", "completed"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const client = await clientPromise;
  const db = client.db("ShadowrunWeb");

  const match = await db.collection("Matches").findOne({
    matchId,
  });

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    // Check if the user is part of the match
    const isPlayerInMatch = [...match.team1, ...match.team2].some(
      (p) => p.discordId === session.user?.id
    );

    if (!isPlayerInMatch) {
      return NextResponse.json(
        { error: "Only match participants can update status" },
        { status: 403 }
      );
    }

    await db
      .collection("Matches")
      .updateOne({ matchId }, { $set: { status } });

    revalidatePath("/matches");
    revalidatePath(`/matches/${matchId}`);

    return NextResponse.json({
      success: true,
      message: "Match status updated successfully",
    });
}

export const POST = withApiSecurity(postStatusMatchHandler, {
  rateLimiter: "api",
  requireAuth: true,
  revalidatePaths: ["/matches"],
});
