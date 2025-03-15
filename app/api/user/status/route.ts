import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { isPlayerBanned } from "@/lib/ban-utils";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[USER-STATUS] Checking status for:", session.user.id);

    // Get ban status using the centralized utility
    const banStatus = await isPlayerBanned(session.user.id);

    const { db } = await connectToDatabase();

    // Find the player for additional information
    const player = await db.collection("Players").findOne({
      discordId: session.user.id,
    });

    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    // Return relevant player status info
    return NextResponse.json({
      isBanned: banStatus.isBanned,
      banExpiry: banStatus.isBanned ? banStatus.banExpiry : null,
      roles: player.roles || [],
      username: player.discordUsername,
      nickname: player.discordNickname,
    });
  } catch (error) {
    console.error("[USER-STATUS] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch user status" },
      { status: 500 }
    );
  }
}
