import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { authOptions } from "@/lib/auth";
import { SECURITY_CONFIG } from "@/lib/security-config";
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity, validateBody } from "@/lib/api-wrapper";
import { triggerModerationLogUpdate } from "@/lib/moderation-log-pusher";
export const dynamic = "force-dynamic";

async function postRemovePlayerHandler(
  req: NextRequest,
  { params }: { params: Promise<{ queueId: string }> },
) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json(
      { error: "You must be signed in to remove a player" },
      { status: 401 },
    );
  }

  const isAdminOrMod =
    session?.user?.id === SECURITY_CONFIG.DEVELOPER_ID ||
    (session.user.roles &&
      (session.user.roles.includes("admin") ||
        session.user.roles.includes("moderator")));

  if (!isAdminOrMod) {
    return NextResponse.json(
      { error: "You don't have permission to remove players" },
      { status: 403 },
    );
  }

  const { queueId: queueIdParam } = await params;
  const queueId = sanitizeString(queueIdParam, 50);
  if (!ObjectId.isValid(queueId)) {
    return NextResponse.json(
      { error: "Invalid queue ID format" },
      { status: 400 },
    );
  }

  const body = await req.json();
  const validation = validateBody(body, {
    playerId: { type: "string", required: true, maxLength: 50 },
  });

  if (!validation.valid) {
    return NextResponse.json(
      { error: validation.errors?.join(", ") || "Invalid input" },
      { status: 400 },
    );
  }

  const { playerId } = validation.data! as { playerId: string };
  const sanitizedPlayerId = sanitizeString(playerId, 50);

  const client = await clientPromise;
  const db = client.db("ShadowrunWeb");
  const queueObjectId = new ObjectId(queueId);

  const queueDoc = await db
    .collection("Queues")
    .findOne({ _id: queueObjectId });
  if (!queueDoc) {
    return NextResponse.json({ error: "Queue not found" }, { status: 404 });
  }

  const players = queueDoc.players as
    | Array<{
        discordId: string;
        discordNickname?: string;
        discordUsername?: string;
      }>
    | undefined;
  const removedPlayer = players?.find((p) => p.discordId === sanitizedPlayerId);
  if (!removedPlayer) {
    return NextResponse.json(
      { error: "Player not in this queue" },
      { status: 400 },
    );
  }

  const result = await db
    .collection("Queues")
    .updateOne({ _id: queueObjectId }, {
      $pull: {
        players: { discordId: sanitizedPlayerId },
      },
    } as any);

  if (result.modifiedCount === 0) {
    return NextResponse.json(
      { error: "Failed to remove player" },
      { status: 400 },
    );
  }

  const removedName =
    removedPlayer.discordNickname || removedPlayer.discordUsername || "Unknown";

  const teamSize = Number(queueDoc.teamSize) || 0;
  const tierLabel = String(queueDoc.eloTier || "open").toUpperCase();
  const queueSummary =
    teamSize > 0 ? `${teamSize}v${teamSize} · ${tierLabel}` : tierLabel;
  const publicReason = `Removed from ranked ${queueSummary} matchmaking queue`;

  try {
    await db.collection("moderation_logs").insertOne({
      action: "queue_remove_player",
      playerId: sanitizedPlayerId,
      playerName: sanitizeString(removedName, 100),
      moderatorId: session.user.id,
      moderatorName: sanitizeString(session.user?.name || "", 100),
      reason: sanitizeString(publicReason, 500),
      queueMongoId: queueId,
      queueSummary: sanitizeString(queueSummary, 80),
      queuePublicId: queueDoc.queueId
        ? sanitizeString(String(queueDoc.queueId), 80)
        : undefined,
      timestamp: new Date(),
    });
    triggerModerationLogUpdate();
  } catch (logError) {
    safeLog.error(
      "remove-player: failed to write moderation_logs entry",
      logError,
    );
  }

  safeLog.info("Queue player removed by staff", {
    queueId,
    targetDiscordId: sanitizedPlayerId,
    moderatorId: session.user.id,
  });

  return NextResponse.json({
    success: true,
    message: "Player removed successfully",
  });
}

export const POST = withApiSecurity(postRemovePlayerHandler, {
  rateLimiter: "admin",
  requireAuth: true,
  requireAdmin: false,
  revalidatePaths: [
    "/matches/queues",
    "/admin/queues",
    "/admin/moderation",
    "/moderation-log",
  ],
});
