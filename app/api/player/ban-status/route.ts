import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Get user session
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Connect to database
    const { db } = await connectToDatabase();

    // Find player by Discord ID
    const player = await db.collection("Players").findOne({
      discordId: session.user.id,
    });

    if (!player) {
      // If player doesn't exist, they can't be banned
      return NextResponse.json({ isBanned: false });
    }

    // Check if player is banned
    if (player.isBanned) {
      // Get the most recent ban reason
      let banReason = "No reason provided";
      if (player.bans && player.bans.length > 0) {
        // Sort bans by timestamp (newest first) and get the most recent one
        const sortedBans = [...player.bans].sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        banReason = sortedBans[0].reason || banReason;
      }

      return NextResponse.json({
        isBanned: true,
        banReason,
        banExpiry: player.banExpiry,
      });
    }

    return NextResponse.json({ isBanned: false });
  } catch (error) {
    console.error("Error checking ban status:", error);
    return NextResponse.json(
      { error: "Failed to check ban status" },
      { status: 500 }
    );
  }
}
