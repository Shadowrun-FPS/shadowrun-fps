import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import {
  ADMIN_ROLE_IDS,
  MODERATOR_ROLE_IDS,
  SECURITY_CONFIG,
} from "@/lib/security-config";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);

    // Check if user has required roles
    const isAuthorized =
      session?.user?.id === SECURITY_CONFIG.DEVELOPER_ID ||
      (session?.user?.roles &&
        (session?.user?.roles.includes("admin") ||
          session?.user?.roles.includes("moderator") ||
          session?.user?.roles.includes("founder")));

    if (!session?.user || !isAuthorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Connect to database
    const { db } = await connectToDatabase();

    // Fetch moderation logs from database
    const logs = await db
      .collection("moderation_logs")
      .find({})
      .sort({ timestamp: -1 })
      .toArray();

    // Get all unique player and moderator IDs from logs
    const playerIds = new Set();
    const moderatorIds = new Set();

    logs.forEach((log) => {
      if (log.playerId) playerIds.add(log.playerId);
      if (log.moderatorId) moderatorIds.add(log.moderatorId);
    });

    // Convert playerIds to an array of valid ObjectIds
    const validPlayerIds = Array.from(playerIds)
      .filter((id): id is string => typeof id === "string")
      .map((id) => new ObjectId(id));

    // Fetch current player information
    const players = await db
      .collection("Players")
      .find({
        $or: [
          { _id: { $in: validPlayerIds } },
          { discordId: { $in: Array.from(moderatorIds) } },
        ],
      })
      .toArray();

    // Create lookup maps for quick access
    const playerMap = new Map();
    const moderatorMap = new Map();

    players.forEach((player) => {
      // Map by ObjectId for players
      if (player._id) {
        playerMap.set(player._id.toString(), {
          nickname: player.discordNickname || player.discordUsername,
          username: player.discordUsername,
        });
      }

      // Map by discordId for moderators
      if (player.discordId) {
        moderatorMap.set(player.discordId, {
          nickname: player.discordNickname || player.discordUsername,
          username: player.discordUsername,
        });
      }
    });

    // Update logs with current names
    const updatedLogs = logs.map((log) => {
      const playerInfo = log.playerId ? playerMap.get(log.playerId) : null;
      const modInfo = log.moderatorId
        ? moderatorMap.get(log.moderatorId)
        : null;

      return {
        ...log,
        // Update player name if we have current info
        playerName: playerInfo ? playerInfo.nickname : log.playerName,
        // Update moderator name if we have current info
        moderatorName: modInfo ? modInfo.nickname : log.moderatorName,
      };
    });

    return NextResponse.json(updatedLogs);
  } catch (error) {
    console.error("Error fetching moderation logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch moderation logs" },
      { status: 500 }
    );
  }
}
