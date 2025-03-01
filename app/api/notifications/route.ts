import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db("ShadowrunWeb");

    let notifications = await db
      .collection("Notifications")
      .find({ recipientId: session.user.id })
      .sort({ createdAt: -1 })
      .toArray();

    // Add test notification for specific user
    if (session.user.id === "238329746671271936") {
      const testNotifications = [
        {
          _id: new ObjectId(),
          type: "TEAM_INVITE",
          recipientId: "238329746671271936",
          senderId: "123456789",
          senderName: "Test User",
          teamId: "test-team-id",
          teamName: "The Test Team",
          status: "PENDING",
          createdAt: Date.now(),
          message: "Test User has invited you to join The Test Team",
        },
        {
          _id: new ObjectId(),
          type: "MATCH_READY",
          recipientId: "238329746671271936",
          senderId: "system",
          senderName: "System",
          matchId: "test-match-id",
          status: "ACCEPTED",
          createdAt: Date.now() - 3600000, // 1 hour ago
          message: "Your match is ready! All players have accepted.",
        },
        {
          _id: new ObjectId(),
          type: "MATCH_COMPLETE",
          recipientId: "238329746671271936",
          senderId: "system",
          senderName: "System",
          matchId: "test-match-id",
          status: "READ",
          createdAt: Date.now() - 7200000, // 2 hours ago
          message: "Match completed! View the results and stats.",
        },
      ];

      notifications = [...testNotifications, ...notifications];
    }

    return NextResponse.json(notifications);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    const client = await clientPromise;
    const db = client.db("ShadowrunWeb");

    const notification = {
      ...data,
      createdAt: Date.now(),
      status: "PENDING",
    };

    await db.collection("Notifications").insertOne(notification);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create notification" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { notificationIds } = await req.json();
    const client = await clientPromise;
    const db = client.db("ShadowrunWeb");

    // Mark notifications as read
    await db
      .collection("TeamNotifications")
      .updateMany(
        { _id: { $in: notificationIds.map((id: string) => new ObjectId(id)) } },
        { $set: { read: true, readAt: new Date() } }
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update notifications:", error);
    return NextResponse.json(
      { error: "Failed to update notifications" },
      { status: 500 }
    );
  }
}
