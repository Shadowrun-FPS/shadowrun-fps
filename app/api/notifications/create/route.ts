import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";

export async function POST(req: NextRequest) {
  try {
    const { type, title, message, recipientId, metadata } = await req.json();
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { db } = await connectToDatabase();

    // Get recipient user info if needed
    // This might come from another collection like "Users" or "Players"
    let recipientUsername = "Unknown";
    let recipientNickname = "Unknown";

    // You might want to look up the recipient info if not provided
    const recipient = await db.collection("Players").findOne({
      discordId: recipientId,
    });

    if (recipient) {
      recipientUsername = recipient.username || "Unknown";
      recipientNickname = recipient.nickname || recipientUsername;
    }

    // Create the notification with user info
    const result = await db.collection("Notifications").insertOne({
      userId: recipientId,
      type,
      title,
      message,
      read: false,
      createdAt: new Date(),
      // Add these fields
      discordUsername: recipientUsername,
      discordNickname: recipientNickname,
      // Store sender info if relevant
      sender: {
        userId: session.user.id,
        username: session.user.name,
        nickname: session.user.nickname || session.user.name,
      },
      metadata,
    });

    return NextResponse.json({
      success: true,
      notificationId: result.insertedId,
    });
  } catch (error) {
    console.error("Error creating notification:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
