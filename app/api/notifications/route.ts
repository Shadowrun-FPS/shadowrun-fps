import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("userId");
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("ShadowrunWeb");

    // Get team invites
    const teamInvites = await db
      .collection("TeamInvites")
      .find({
        inviteeId: userId,
        status: "pending",
      })
      .sort({ createdAt: -1 })
      .toArray();

    // Get team notifications (role changes, removals, etc.)
    const teamNotifications = await db
      .collection("TeamNotifications")
      .find({
        userId,
        read: false,
      })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({
      teamInvites,
      teamNotifications,
    });
  } catch (error) {
    console.error("Failed to fetch notifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
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
