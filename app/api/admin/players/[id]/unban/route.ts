import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { createModerationLog } from "@/lib/moderation";

// Add interface for the request body at the top of the file
interface UnbanRequest {
  reason?: string;
}

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

    // Parse the request body with proper typing
    const data: UnbanRequest = await req.json();

    const reason = data?.reason || "Ban canceled by administrator";

    // Connect to database
    const { db } = await connectToDatabase();

    // Get the moderator's information
    const moderator = await db.collection("Players").findOne({
      discordId: session.user.id,
    });

    const moderatorNickname = moderator?.discordNickname || session.user.name;

    // Get player details for the log
    const player = await db.collection("Players").findOne({
      _id: new ObjectId(params.id),
    });

    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    // Update player to remove ban status but preserve ban history
    const updateResult = await db.collection("Players").updateOne(
      { _id: new ObjectId(params.id) },
      {
        $set: {
          isBanned: false,
          banExpiry: null,
          updatedAt: new Date(),
        },
      }
    );

    // Create moderation log for the unban action
    await createModerationLog({
      playerId: params.id,
      moderatorId: session.user.id,
      playerName:
        player?.discordNickname || player?.discordUsername || "Unknown Player",
      moderatorName:
        moderatorNickname || session.user.name || "Unknown Moderator",
      action: "unban",
      reason: reason,
      timestamp: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error unbanning player:", error);
    return NextResponse.json(
      {
        error: "Failed to unban player",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
