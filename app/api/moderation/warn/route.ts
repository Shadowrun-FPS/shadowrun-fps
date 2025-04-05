import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has admin or moderator role
    const isAdmin = session.user.roles?.includes("admin");
    const isModerator = session.user.roles?.includes("moderator");
    const isSpecificUser = session.user.id === "238329746671271936";

    if (!isAdmin && !isModerator && !isSpecificUser) {
      return NextResponse.json(
        { error: "You don't have permission to warn players" },
        { status: 403 }
      );
    }

    const { playerId, playerName, reason, ruleId } = await request.json();

    if (!playerId || !reason) {
      return NextResponse.json(
        { error: "Player ID and reason are required" },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    // Get moderator details
    const moderator = await db.collection("Players").findOne({
      discordId: session.user.id,
    });

    const moderatorName =
      moderator?.discordNickname ||
      moderator?.discordUsername ||
      session.user.name;

    // Create warning log
    const warningLog = {
      playerId: new ObjectId(playerId),
      moderatorId: session.user.id,
      playerName, // Use the provided player name
      moderatorName, // Use the moderator's name
      action: "warn",
      reason,
      ruleId: ruleId || null,
      timestamp: new Date(),
    };

    await db.collection("moderation_logs").insertOne(warningLog);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error warning player:", error);
    return NextResponse.json(
      { error: "Failed to warn player" },
      { status: 500 }
    );
  }
}
