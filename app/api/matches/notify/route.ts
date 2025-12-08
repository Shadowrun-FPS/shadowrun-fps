import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity, validateBody } from "@/lib/api-wrapper";
import { revalidatePath } from "next/cache";

async function postNotifyMatchHandler(req: NextRequest) {
  const body = await req.json();
  const validation = validateBody(body, {
    matchId: { type: "string", required: true, maxLength: 100 },
    players: { type: "array", required: true },
  });

  if (!validation.valid) {
    return NextResponse.json(
      { error: validation.errors?.join(", ") || "Invalid input" },
      { status: 400 }
    );
  }

  const { matchId, players } = validation.data! as {
    matchId: string;
    players: Array<{ discordId: string }>;
  };

  const sanitizedMatchId = sanitizeString(matchId, 100);
  const client = await clientPromise;
  const db = client.db("ShadowrunWeb");

  const notifications = players.map((player: any) => ({
    userId: sanitizeString(player.discordId, 50),
    type: "match_ready",
    title: "Match Ready",
    message: "Your match is ready to begin!",
    matchId: sanitizedMatchId,
    read: false,
    createdAt: new Date(),
  }));

  await db.collection("Notifications").insertMany(notifications);

  revalidatePath("/notifications");

  return NextResponse.json({ success: true });
}

export const POST = withApiSecurity(postNotifyMatchHandler, {
  rateLimiter: "api",
  requireAuth: true,
  revalidatePaths: ["/notifications"],
});
