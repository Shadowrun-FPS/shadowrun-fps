import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ObjectId } from "mongodb";
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity, validateBody } from "@/lib/api-wrapper";

async function getDisputesHandler(request: Request) {
  const session = await getServerSession(authOptions);

  if (process.env.NODE_ENV !== "development") {
    if (
      !session?.user?.roles?.includes("admin") &&
      !session?.user?.roles?.includes("moderator")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
  }

  const client = await clientPromise;
  const db = client.db();
  const collection = db.collection("moderation_disputes");

  const disputes = await collection
    .find({ status: "pending" })
    .sort({ createdAt: -1 })
    .toArray();

  const response = NextResponse.json({ disputes });
  response.headers.set(
    "Cache-Control",
    "private, no-cache, no-store, must-revalidate"
  );
  return response;
}

export const GET = withApiSecurity(getDisputesHandler, {
  rateLimiter: "api",
  requireAuth: false,
});

async function postDisputeHandler(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const userId = sanitizeString(session.user.id, 50);
  const body = await request.json();
  const validation = validateBody(body, {
    moderationLogId: { type: "string", required: true, maxLength: 50 },
    reason: { type: "string", required: true, maxLength: 2000 },
  });

  if (!validation.valid) {
    return NextResponse.json(
      { error: validation.errors?.join(", ") || "Invalid input" },
      { status: 400 }
    );
  }

  const { moderationLogId, reason } = validation.data! as {
    moderationLogId: string;
    reason: string;
  };

  const sanitizedModerationLogId = sanitizeString(moderationLogId, 50);
  if (!ObjectId.isValid(sanitizedModerationLogId)) {
    return NextResponse.json(
      { error: "Invalid moderation log ID" },
      { status: 400 }
    );
  }

  const sanitizedReason = sanitizeString(reason, 2000);

    const client = await clientPromise;
    const db = client.db();
    const disputesCollection = db.collection("moderation_disputes");
    const logsCollection = db.collection("moderation_logs");

    const log = await logsCollection.findOne({
      _id: new ObjectId(sanitizedModerationLogId),
    });

    if (!log) {
      return NextResponse.json(
        { error: "Moderation log not found" },
        { status: 404 }
      );
    }

    if (log.playerId !== userId) {
      return NextResponse.json(
        { error: "You can only dispute actions against your own account" },
        { status: 403 }
      );
    }

    const existingDispute = await disputesCollection.findOne({
      moderationLogId: new ObjectId(sanitizedModerationLogId),
    });

    if (existingDispute) {
      return NextResponse.json(
        { error: "A dispute already exists for this moderation action" },
        { status: 400 }
      );
    }

    const newDispute = {
      moderationLogId: new ObjectId(sanitizedModerationLogId),
      playerId: userId,
      playerName: sanitizeString(session.user.name || "", 100),
      playerDiscordId: userId,
      reason: sanitizedReason,
      status: "pending",
      createdAt: new Date(),
      moderationAction: log,
    };

    const result = await disputesCollection.insertOne(newDispute);

    await logsCollection.updateOne(
      { _id: new ObjectId(sanitizedModerationLogId) },
      { $set: { hasDispute: true } }
    );

    const notificationsCollection = db.collection("notifications");
    await notificationsCollection.insertOne({
      type: "new_dispute",
      targetRoles: ["admin", "moderator"],
      title: "New Dispute Filed",
      content: sanitizeString(
        `${session.user.name || "User"} has disputed a moderation action.`,
        500
      ),
      read: false,
      createdAt: new Date(),
      relatedId: result.insertedId,
    });

    return NextResponse.json({
      success: true,
      id: result.insertedId,
    });
}

export const POST = withApiSecurity(postDisputeHandler, {
  rateLimiter: "api",
  requireAuth: true,
});
