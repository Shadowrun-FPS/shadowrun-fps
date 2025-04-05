import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { createModerationLog } from "@/lib/moderation";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);

    // Check if user has required roles
    const isAuthorized =
      session?.user?.id === "238329746671271936" || // Your ID
      (session?.user?.roles &&
        (session?.user?.roles.includes("admin") ||
          session?.user?.roles.includes("moderator") ||
          session?.user?.roles.includes("founder")));

    if (!session?.user || !isAuthorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse the request body
    const warning = await req.json();

    // Connect to database
    const { db } = await connectToDatabase();

    // Get the moderator's information to fetch their nickname
    const moderator = await db.collection("Players").findOne({
      discordId: session.user.id,
    });

    // Get the player's information to fetch their nickname
    const player = await db.collection("Players").findOne({
      _id: new ObjectId(params.id),
    });

    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    const moderatorNickname = moderator?.discordNickname || session.user.name;
    const playerNickname = player.discordNickname || player.discordUsername;

    // Add warning to player
    const result = await db.collection("Players").updateOne(
      { _id: new ObjectId(params.id) },
      {
        $push: {
          warnings: {
            ...warning,
            moderatorId: session.user.id,
            moderatorName: session.user.name,
            moderatorNickname: moderatorNickname,
            timestamp: new Date(),
          },
        },
        $set: {
          updatedAt: new Date(),
        },
      }
    );

    // Create a record in the moderation logs collection
    await createModerationLog({
      playerId: params.id,
      moderatorId: session.user.id,
      playerName: playerNickname,
      moderatorName: moderatorNickname,
      action: "warn",
      reason: warning.reason,
      ruleId: warning.ruleId,
      timestamp: new Date(),
    });

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: "Failed to add warning to player" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, warning });
  } catch (error) {
    console.error("Error adding warning to player:", error);
    return NextResponse.json(
      { error: "Failed to add warning to player" },
      { status: 500 }
    );
  }
}
