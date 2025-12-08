import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import {
  getGuildData,
  upsertPlayerDiscordData,
  updatePlayerGuildNickname,
} from "@/lib/discord-helpers";
import { SECURITY_CONFIG } from "@/lib/security-config";
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity } from "@/lib/api-wrapper";
import { revalidatePath } from "next/cache";

interface ExtendedSession {
  user: {
    id: string;
    name?: string | null;
    nickname?: string | null;
    image?: string | null;
  };
  accessToken?: string;
  expires: string;
}

async function postUpdatePlayerHandler(req: NextRequest) {
  try {
    const session = (await getServerSession(
      authOptions
    )) as ExtendedSession | null;

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    safeLog.log("Player update API called for user:", session.user.id);

    if (session.user.id === SECURITY_CONFIG.DEVELOPER_ID) {
      const nickname =
        sanitizeString(session.user.nickname || session.user.name || "Developer", 100);
      safeLog.log(`Developer account: using nickname ${nickname}`);

      await updatePlayerGuildNickname(session.user.id, nickname);

      return NextResponse.json({
        success: true,
        message: "Developer account updated successfully",
        nickname,
      });
    }

    const accessToken = session.accessToken;

    if (!accessToken) {
      safeLog.log("No access token available for user", session.user.id);

      const fallbackName = sanitizeString(session.user.nickname || session.user.name || "User", 100);
      safeLog.log(`No access token: using fallback name ${fallbackName}`);

      await updatePlayerGuildNickname(session.user.id, fallbackName);

      return NextResponse.json({
        success: true,
        message: "Updated with fallback nickname",
        nickname: fallbackName,
      });
    }

    try {
      const guildData = await getGuildData(accessToken);

      if (!guildData) {
        safeLog.log("Failed to get guild data for user", session.user.id);

        const fallbackName = sanitizeString(
          session.user.nickname || session.user.name || "User",
          100
        );
        safeLog.log(`No guild data: using fallback name ${fallbackName}`);

        await updatePlayerGuildNickname(session.user.id, fallbackName);

        return NextResponse.json({
          success: true,
          message: "Updated with fallback nickname due to missing guild data",
          nickname: fallbackName,
        });
      }

      const guildNickname = sanitizeString(
        guildData.nick || session.user.nickname || session.user.name || "User",
        100
      );

      safeLog.log(
        `Using guild nickname: ${guildNickname} for user ${session.user.id}`
      );

      await updatePlayerGuildNickname(session.user.id, guildNickname);

      return NextResponse.json({
        success: true,
        nickname: guildNickname,
        source: guildData.nick
          ? "guild_api"
          : session.user.nickname
          ? "session_nickname"
          : "username",
      });
    } catch (error) {
      safeLog.error("Error getting guild data:", error);

      const fallbackName = sanitizeString(session.user.nickname || session.user.name || "User", 100);
      safeLog.log(`API error: using fallback name ${fallbackName}`);

      await updatePlayerGuildNickname(session.user.id, fallbackName);

      revalidatePath("/players");
      revalidatePath(`/players/${session.user.id}`);
      
      return NextResponse.json({
        success: true,
        message: "Updated with session nickname due to Discord API error",
        nickname: fallbackName,
      });
    }
  } catch (error) {
    safeLog.error("Error updating player:", error);
    return NextResponse.json(
      { error: "Failed to update player" },
      { status: 500 }
    );
  }
}

export const POST = withApiSecurity(postUpdatePlayerHandler, {
  rateLimiter: "api",
  requireAuth: true,
  revalidatePaths: ["/players"],
});
