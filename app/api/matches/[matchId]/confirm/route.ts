import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { updatePlayerStats } from "@/lib/match-helpers";
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity, validateBody } from "@/lib/api-wrapper";
import { revalidatePath } from "next/cache";

async function postConfirmMatchHandler(
  req: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const { matchId: matchIdParam } = await params;
  const matchId = sanitizeString(matchIdParam, 100);
  if (!ObjectId.isValid(matchId)) {
    return NextResponse.json(
      { error: "Invalid match ID" },
      { status: 400 }
    );
  }

  const body = await req.json();
  const validation = validateBody(body, {
    confirmerId: { type: "string", required: true, maxLength: 50 },
    confirm: { type: "boolean", required: true },
  });

  if (!validation.valid) {
    return NextResponse.json(
      { error: validation.errors?.join(", ") || "Invalid input" },
      { status: 400 }
    );
  }

  const { confirmerId, confirm } = validation.data! as {
    confirmerId: string;
    confirm: boolean;
  };

  const sanitizedConfirmerId = sanitizeString(confirmerId, 50);
  const client = await clientPromise;
  const db = client.db("ShadowrunWeb");

  const match = await db.collection("Matches").findOne({
    _id: new ObjectId(matchId),
  });

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    // Verify confirmer is from opposing team
    const isTeam1 = match.team1Players.includes(match.submittedBy);
    const opposingTeam = isTeam1 ? match.team2Players : match.team1Players;

  if (!opposingTeam.includes(sanitizedConfirmerId)) {
    return NextResponse.json(
      { error: "Only opposing team members can confirm results" },
      { status: 403 }
    );
  }

  if (confirm) {
    await db.collection("Matches").updateOne(
      { _id: new ObjectId(matchId) },
      {
        $set: {
          status: "confirmed",
          confirmedBy: sanitizedConfirmerId,
          confirmedAt: new Date(),
        },
      }
    );

    await updatePlayerStats(db, match as any);
  } else {
    await db.collection("Matches").updateOne(
      { _id: new ObjectId(matchId) },
      {
        $set: {
          status: "disputed",
          disputedBy: sanitizedConfirmerId,
          disputedAt: new Date(),
        },
      }
    );
  }

  revalidatePath("/matches");
  revalidatePath(`/matches/${matchId}`);

  return NextResponse.json({ success: true });
}

export const POST = withApiSecurity(postConfirmMatchHandler, {
  rateLimiter: "api",
  requireAuth: true,
  revalidatePaths: ["/matches"],
});
