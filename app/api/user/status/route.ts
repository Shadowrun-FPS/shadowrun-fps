import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { isPlayerBanned } from "@/lib/ban-utils";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db();

    const user = await db.collection("Users").findOne({
      discordId: session.user.id,
    });

    if (!user) {
      return NextResponse.json({ roles: [] }, { status: 200 });
    }

    // Get ban status using the centralized utility
    const banStatus = await isPlayerBanned(session.user.id);

    // Find the player for additional information
    const player = await db.collection("Players").findOne({
      discordId: session.user.id,
    });

    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: user.discordId,
      username: user.username,
      roles: user.roles || [],
      isBanned: banStatus.isBanned,
      banExpiry: banStatus.isBanned ? banStatus.banExpiry : null,
      nickname: player.discordNickname,
    });
  } catch (error) {
    console.error("Error fetching user status:", error);
    return NextResponse.json(
      { error: "Failed to fetch user data" },
      { status: 500 }
    );
  }
}
