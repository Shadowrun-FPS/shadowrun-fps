import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ObjectId } from "mongodb";

// Get all disputes
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    // Skip authentication in development mode for testing
    if (process.env.NODE_ENV !== "development") {
      // Check if user has permission to view disputes
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

    return NextResponse.json({ disputes });
  } catch (error) {
    console.error("Failed to fetch disputes:", error);
    return NextResponse.json(
      { error: "Failed to fetch disputes" },
      { status: 500 }
    );
  }
}

// Create a new dispute
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    // Users must be logged in to create disputes
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { moderationLogId, reason } = body;

    const client = await clientPromise;
    const db = client.db();
    const disputesCollection = db.collection("moderation_disputes");
    const logsCollection = db.collection("moderation_logs");

    // Verify the moderation log exists
    const log = await logsCollection.findOne({
      _id: new ObjectId(moderationLogId),
    });

    if (!log) {
      return NextResponse.json(
        { error: "Moderation log not found" },
        { status: 404 }
      );
    }

    // Check if the user is the one who was moderated
    if (log.playerId !== session.user.id) {
      return NextResponse.json(
        { error: "You can only dispute actions against your own account" },
        { status: 403 }
      );
    }

    // Check if a dispute already exists
    const existingDispute = await disputesCollection.findOne({
      moderationLogId: new ObjectId(moderationLogId),
    });

    if (existingDispute) {
      return NextResponse.json(
        { error: "A dispute already exists for this moderation action" },
        { status: 400 }
      );
    }

    // Create the dispute
    const newDispute = {
      moderationLogId: new ObjectId(moderationLogId),
      playerId: session.user.id,
      playerName: session.user.name,
      playerDiscordId: session.user.id, // Assuming Discord ID is stored in user.id
      reason,
      status: "pending",
      createdAt: new Date(),
      moderationAction: log,
    };

    const result = await disputesCollection.insertOne(newDispute);

    // Update the moderation log to indicate there's a dispute
    await logsCollection.updateOne(
      { _id: new ObjectId(moderationLogId) },
      { $set: { hasDispute: true } }
    );

    // Create a notification for moderators
    const notificationsCollection = db.collection("notifications");
    await notificationsCollection.insertOne({
      type: "new_dispute",
      targetRoles: ["admin", "moderator"],
      title: "New Dispute Filed",
      content: `${session.user.name} has disputed a moderation action.`,
      read: false,
      createdAt: new Date(),
      relatedId: result.insertedId,
    });

    return NextResponse.json({
      success: true,
      id: result.insertedId,
    });
  } catch (error) {
    console.error("Failed to create dispute:", error);
    return NextResponse.json(
      { error: "Failed to create dispute" },
      { status: 500 }
    );
  }
}
