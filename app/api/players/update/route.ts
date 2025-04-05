import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    // Get the current session
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db();

    // Extract user data from session
    const { id: discordId, name, image } = session.user;

    // Map Discord fields correctly
    const discordNickname = session.user.nickname;
    const discordUsername = session.user.name;
    const discordProfilePicture = image;

    // Update or create player document
    const result = await db.collection("Players").updateOne(
      { discordId },
      {
        $set: {
          discordNickname: discordNickname,
          discordUsername: discordUsername,
          discordProfilePicture: discordProfilePicture,
          updatedAt: new Date().toISOString(),
        },
        $setOnInsert: {
          stats: [],
          createdAt: new Date().toISOString(),
        },
      },
      { upsert: true }
    );

    return NextResponse.json({
      success: true,
      updated: result.modifiedCount > 0,
      created: result.upsertedCount > 0,
    });
  } catch (error) {
    console.error("Error updating player:", error);
    return NextResponse.json(
      { error: "Failed to update player" },
      { status: 500 }
    );
  }
}
