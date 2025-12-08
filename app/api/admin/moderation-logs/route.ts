import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import {
  ADMIN_ROLE_IDS,
  MODERATOR_ROLE_IDS,
  SECURITY_CONFIG,
  hasAdminRole,
  hasModeratorRole,
} from "@/lib/security-config";
import { getDiscordUserInfoBatch } from "@/lib/discord-user-info";
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity } from "@/lib/api-wrapper";

export const dynamic = "force-dynamic";

async function getModerationLogsHandler(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const DEVELOPER_DISCORD_ID = "238329746671271936";
  const isDeveloper = 
    session.user.id === SECURITY_CONFIG.DEVELOPER_ID || 
    session.user.id === DEVELOPER_DISCORD_ID;
  
  const userRoles = session.user.roles || [];
  const userHasAdminRole = hasAdminRole(userRoles);
  const userHasModeratorRole = hasModeratorRole(userRoles);
  const isAdminUser = session.user.isAdmin;

  const isAuthorized =
    isDeveloper || isAdminUser || userHasAdminRole || userHasModeratorRole;

  if (!isAuthorized) {
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

    // Get all unique player and moderator Discord IDs from logs
    const playerDiscordIds = new Set<string>();
    const moderatorDiscordIds = new Set<string>();

    logs.forEach((log) => {
      // For players, we need to get their Discord ID from the Players collection
      // For moderators, moderatorId should be the Discord ID
      if (log.moderatorId) {
        moderatorDiscordIds.add(log.moderatorId);
      }
    });

    // Fetch player Discord IDs from Players collection
    const playerIds = new Set<string>();
    logs.forEach((log) => {
      if (log.playerId) {
        // playerId might be ObjectId or Discord ID, we'll check both
        playerIds.add(log.playerId);
      }
    });

    // Convert playerIds to an array of valid ObjectIds for Players collection lookup
    const validPlayerObjectIds = Array.from(playerIds)
      .filter((id): id is string => typeof id === "string")
      .filter((id) => ObjectId.isValid(id))
      .map((id) => new ObjectId(id));

    // Fetch players to get their Discord IDs
    const players = await db
      .collection("Players")
      .find({
        $or: [
          { _id: { $in: validPlayerObjectIds } },
          { discordId: { $in: Array.from(playerIds) } },
        ],
      })
      .toArray();

    // Extract Discord IDs from players
    players.forEach((player) => {
      if (player.discordId) {
        playerDiscordIds.add(player.discordId);
      }
    });

    // Also check if any playerId is already a Discord ID
    playerIds.forEach((id) => {
      // If it's not a valid ObjectId, assume it's a Discord ID
      if (!ObjectId.isValid(id)) {
        playerDiscordIds.add(id);
      }
    });

    // Fetch Discord user info for all players and moderators
    const playerIdsArray = Array.from(playerDiscordIds);
    const moderatorIdsArray = Array.from(moderatorDiscordIds);
    const allDiscordIds = Array.from(
      new Set([...playerIdsArray, ...moderatorIdsArray])
    );
    const discordUserInfoMap = await getDiscordUserInfoBatch(allDiscordIds);

    // Create a map from playerId (ObjectId) to Discord ID
    const playerIdToDiscordId = new Map<string, string>();
    players.forEach((player) => {
      if (player._id && player.discordId) {
        playerIdToDiscordId.set(player._id.toString(), player.discordId);
      }
    });

    // Update logs with current Discord info
    const updatedLogs = logs.map((log) => {
      // Get Discord ID for player
      let playerDiscordId: string | null = null;
      if (log.playerId) {
        // Check if playerId is already a Discord ID
        if (!ObjectId.isValid(log.playerId)) {
          playerDiscordId = log.playerId;
        } else {
          // Look up Discord ID from ObjectId
          playerDiscordId = playerIdToDiscordId.get(log.playerId) || null;
        }
      }

      // Get Discord info for player and moderator
      const playerInfo = playerDiscordId
        ? discordUserInfoMap.get(playerDiscordId)
        : null;
      const moderatorInfo = log.moderatorId
        ? discordUserInfoMap.get(log.moderatorId)
        : null;

      return {
        ...log,
        // Update player info with current Discord data
        playerName: playerInfo
          ? playerInfo.nickname || playerInfo.username
          : log.playerName,
        playerNickname: playerInfo?.nickname,
        playerProfilePicture: playerInfo?.profilePicture || null,
        playerDiscordId: playerDiscordId,
        // Update moderator info with current Discord data
        moderatorName: moderatorInfo
          ? moderatorInfo.nickname || moderatorInfo.username
          : log.moderatorName,
        moderatorNickname: moderatorInfo?.nickname,
        moderatorProfilePicture: moderatorInfo?.profilePicture || null,
        moderatorDiscordId: log.moderatorId,
      };
    });

    const response = NextResponse.json(updatedLogs);
    response.headers.set(
      "Cache-Control",
      "private, no-cache, no-store, must-revalidate"
    );
    return response;
}

export const GET = withApiSecurity(getModerationLogsHandler, {
  rateLimiter: "admin",
  requireAuth: true,
});
