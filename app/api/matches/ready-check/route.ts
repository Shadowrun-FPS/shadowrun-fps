import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId, Document, WithId } from "mongodb";
import { sendDiscordWebhook } from "@/lib/discord";
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity, validateBody } from "@/lib/api-wrapper";
import { revalidatePath } from "next/cache";

interface Player {
  discordId: string;
  name: string;
}

interface Match extends WithId<Document> {
  _id: ObjectId;
  team1: {
    players: Player[];
  };
  team2: {
    players: Player[];
  };
  readyCheck?: {
    status: string;
    readyPlayers: string[];
    startedAt: Date;
  };
}

async function postReadyCheckHandler(req: NextRequest) {
  const body = await req.json();
  const validation = validateBody(body, {
    matchId: { type: "string", required: true, maxLength: 100 },
  });

  if (!validation.valid) {
    return NextResponse.json(
      { error: validation.errors?.join(", ") || "Invalid input" },
      { status: 400 }
    );
  }

  const { matchId } = validation.data! as { matchId: string };
  const sanitizedMatchId = sanitizeString(matchId, 100);

  if (!ObjectId.isValid(sanitizedMatchId)) {
    return NextResponse.json(
      { error: "Invalid match ID" },
      { status: 400 }
    );
  }

  const client = await clientPromise;
  const db = client.db("ShadowrunWeb");

  const match = await db.collection<Match>("Matches").findOne({
    _id: new ObjectId(sanitizedMatchId),
  });

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    const allPlayers = [...match.team1.players, ...match.team2.players].map(
      (p) => p.discordId
    );

  await db.collection("Matches").updateOne(
    { _id: new ObjectId(sanitizedMatchId) },
    {
      $set: {
        readyCheck: {
          status: "pending",
          readyPlayers: [],
          startedAt: new Date(),
        },
      },
    }
  );

  revalidatePath("/matches");
  revalidatePath(`/matches/${sanitizedMatchId}`);

  return NextResponse.json({ success: true, players: allPlayers });
}

export const POST = withApiSecurity(postReadyCheckHandler, {
  rateLimiter: "api",
  requireAuth: true,
  revalidatePaths: ["/matches"],
});
