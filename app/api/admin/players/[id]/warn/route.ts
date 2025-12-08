import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { createModerationLog } from "@/lib/moderation";
import { isAuthorizedAdmin } from "@/lib/admin-auth";
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity, validateBody } from "@/lib/api-wrapper";
import { revalidatePath } from "next/cache";

async function postWarnPlayerHandler(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!isAuthorizedAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const playerId = sanitizeString(params.id, 50);
  if (!ObjectId.isValid(playerId)) {
    return NextResponse.json(
      { error: "Invalid player ID" },
      { status: 400 }
    );
  }

  const warning = await req.json();
  const validation = validateBody(warning, {
    reason: { type: "string", required: true, maxLength: 1000 },
    ruleId: { type: "string", required: false, maxLength: 50 },
  });

  if (!validation.valid) {
    return NextResponse.json(
      { error: validation.errors?.join(", ") || "Invalid input" },
      { status: 400 }
    );
  }

  const { reason, ruleId } = validation.data! as {
    reason: string;
    ruleId?: string;
  };

  const sanitizedReason = sanitizeString(reason, 1000);
  const sanitizedRuleId = ruleId ? sanitizeString(ruleId, 50) : null;

    const { db } = await connectToDatabase();

    const moderator = await db.collection("Players").findOne({
      discordId: sanitizeString(session.user.id, 50),
    });

    const player = await db.collection("Players").findOne({
      _id: new ObjectId(playerId),
    });

    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    const moderatorNickname = sanitizeString(
      moderator?.discordNickname || session.user.name || "",
      100
    );
    const playerNickname = sanitizeString(
      player.discordNickname || player.discordUsername || "",
      100
    );

    const result = await db.collection("Players").updateOne(
      { _id: new ObjectId(playerId) },
      {
        $push: {
          warnings: {
            reason: sanitizedReason,
            ruleId: sanitizedRuleId,
            moderatorId: sanitizeString(session.user.id, 50),
            moderatorName: sanitizeString(session.user.name || "", 100),
            moderatorNickname: moderatorNickname,
            timestamp: new Date(),
          },
        },
      } as any
    );

    await createModerationLog({
      playerId: playerId,
      moderatorId: sanitizeString(session.user.id, 50),
      playerName: playerNickname,
      moderatorName: moderatorNickname,
      action: "warn",
      reason: sanitizedReason,
      ruleId: sanitizedRuleId || null,
      timestamp: new Date(),
    });

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: "Failed to add warning to player" },
        { status: 500 }
      );
    }

    revalidatePath("/admin/players");
    revalidatePath(`/admin/players/${playerId}`);

    return NextResponse.json({
      success: true,
      warning: { reason: sanitizedReason, ruleId: sanitizedRuleId },
    });
}

export const POST = withApiSecurity(postWarnPlayerHandler, {
  rateLimiter: "admin",
  requireAuth: true,
  requireAdmin: true,
  revalidatePaths: ["/admin/players"],
});
