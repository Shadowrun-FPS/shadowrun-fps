import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { db } = await connectToDatabase();
    const id = params.id;

    console.log("Attempting to delete notification:", id);
    console.log("User ID from session:", session.user.id);

    // Try to find the notification first to debug
    const notification = await db.collection("Notifications").findOne({
      _id: new ObjectId(id),
    });

    console.log("Found notification:", notification);

    if (!notification) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 }
      );
    }

    // Check if the user ID matches
    const userIdMatches = notification.userId === session.user.id;
    console.log("User ID matches:", userIdMatches);

    // Use the same ID format as stored in the notification
    const result = await db.collection("Notifications").deleteOne({
      _id: new ObjectId(id),
      userId: notification.userId, // Use the exact format from the notification
    });

    console.log("Delete result:", result);

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Notification not found or not authorized to delete" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete notification:", error);
    return NextResponse.json(
      { error: "Failed to delete notification", details: String(error) },
      { status: 500 }
    );
  }
}
