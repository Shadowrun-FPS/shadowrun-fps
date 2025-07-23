import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import {
  getGuildData,
  upsertPlayerDiscordData,
  updatePlayerGuildNickname,
} from "@/lib/discord-helpers";
import { SECURITY_CONFIG } from "@/lib/security-config";

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

export async function POST(req: NextRequest) {
  try {
    const session = (await getServerSession(
      authOptions
    )) as ExtendedSession | null;

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("Player update API called for user:", session.user.id);
    console.log("Session nickname:", session.user.nickname);
    console.log("Session name:", session.user.name);

    if (session.user.id === SECURITY_CONFIG.DEVELOPER_ID) {
      const nickname =
        session.user.nickname || session.user.name || "Developer";
      console.log(`Developer account: using nickname ${nickname}`);

      await updatePlayerGuildNickname(session.user.id, nickname);

      return NextResponse.json({
        success: true,
        message: "Developer account updated successfully",
        nickname,
      });
    }

    const accessToken = session.accessToken;

    if (!accessToken) {
      console.log("No access token available for user", session.user.id);

      const fallbackName = session.user.nickname || session.user.name || "User";
      console.log(`No access token: using fallback name ${fallbackName}`);

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
        console.log("Failed to get guild data for user", session.user.id);

        const fallbackName =
          session.user.nickname || session.user.name || "User";
        console.log(`No guild data: using fallback name ${fallbackName}`);

        await updatePlayerGuildNickname(session.user.id, fallbackName);

        return NextResponse.json({
          success: true,
          message: "Updated with fallback nickname due to missing guild data",
          nickname: fallbackName,
        });
      }

      const guildNickname =
        guildData.nick || session.user.nickname || session.user.name;

      console.log(
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
      console.error("Error getting guild data:", error);

      const fallbackName = session.user.nickname || session.user.name || "User";
      console.log(`API error: using fallback name ${fallbackName}`);

      await updatePlayerGuildNickname(session.user.id, fallbackName);

      return NextResponse.json({
        success: true,
        message: "Updated with session nickname due to Discord API error",
        nickname: fallbackName,
      });
    }
  } catch (error) {
    console.error("Error updating player:", error);
    return NextResponse.json(
      { error: "Failed to update player" },
      { status: 500 }
    );
  }
}
