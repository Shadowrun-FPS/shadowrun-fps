import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId, UpdateFilter, Document } from "mongodb";
import { createModerationLog } from "@/lib/moderation";

// Define types for your ban object
interface BanRecord {
  reason: string;
  ruleId: string | null;
  moderatorId: string;
  moderatorName: string | null | undefined;
  moderatorNickname: string | undefined;
  duration: string | number;
  expiry: Date | null;
  timestamp: Date;
}

// Define interface for the Player document
interface Player {
  _id: ObjectId;
  bans: BanRecord[];
  isBanned: boolean;
  banExpiry: Date | null;
  updatedAt: Date;
  // other necessary fields...
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

    // Parse the request body
    const ban = await req.json();

    // Added logging to debug request
    console.log("Ban request:", { params, ban, sessionUser: session.user.id });

    // Calculate ban expiry
    let banExpiry = null;
    let duration = ban.duration;

    if (duration !== "permanent") {
      const now = new Date();
      if (duration === "24h") {
        banExpiry = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      } else if (duration === "3d") {
        banExpiry = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
      } else if (duration === "7d") {
        banExpiry = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      } else if (duration === "30d") {
        banExpiry = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      }
    }

    // Connect to database
    const { db } = await connectToDatabase();

    try {
      // Get the moderator's information to fetch their nickname
      const moderator = await db.collection("Players").findOne({
        discordId: session.user.id,
      });

      const moderatorNickname = moderator?.discordNickname || session.user.name;

      // Try to find the player first to confirm they exist
      const playerExists = await db.collection("Players").findOne({
        _id: new ObjectId(params.id),
      });

      if (!playerExists) {
        return NextResponse.json(
          { error: "Player not found" },
          { status: 404 }
        );
      }

      // Create the ban object with proper typing
      const banRecord: BanRecord = {
        reason: ban.reason || "No reason provided",
        ruleId: ban.ruleId || null,
        moderatorId: session.user.id,
        moderatorName: session.user.name,
        moderatorNickname: session.user.nickname,
        duration: ban.duration,
        expiry: ban.duration ? new Date(Date.now() + ban.duration) : null,
        timestamp: new Date(),
      };

      // Define the update document
      const updateDoc = {
        $push: { bans: banRecord },
        $set: {
          isBanned: true,
          banExpiry: banExpiry,
          updatedAt: new Date(),
        },
      };

      // Cast to unknown first, then to UpdateFilter<Document>
      const typedUpdateDoc = updateDoc as unknown as UpdateFilter<Document>;

      const result = await db
        .collection("Players")
        .updateOne({ _id: new ObjectId(params.id) }, typedUpdateDoc);

      // Create a record in the moderation logs collection
      await createModerationLog({
        playerId: params.id,
        moderatorId: session.user.id,
        playerName:
          playerExists.discordNickname || playerExists.discordUsername,
        moderatorName: moderatorNickname,
        action: "ban",
        reason: ban.reason || "No reason provided",
        ruleId: ban.ruleId || null,
        duration: duration || "24h",
        expiry: banExpiry,
        timestamp: new Date(),
      });

      if (result.modifiedCount === 0) {
        return NextResponse.json(
          { error: "Failed to update player record" },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, ban });
    } catch (dbError) {
      console.error("Database error:", dbError);
      return NextResponse.json(
        {
          error: "Database operation failed",
          details: dbError instanceof Error ? dbError.message : String(dbError),
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error banning player:", error);
    return NextResponse.json(
      {
        error: "Failed to ban player",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
