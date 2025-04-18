import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import {
  getGuildData,
  upsertPlayerDiscordData,
  updatePlayerGuildNickname,
} from "@/lib/discord-helpers";

// Extend the Session type to include accessToken
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

    // Developer account special case - bypass Discord API calls
    if (session.user.id === "238329746671271936") {
      // For developer, prioritize the nickname from session if available
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

    // Get the access token from the session
    const accessToken = session.accessToken;

    if (!accessToken) {
      console.log("No access token available for user", session.user.id);

      // Use the user's nickname from session if available
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
      // Get Discord guild data
      const guildData = await getGuildData(accessToken);

      if (!guildData) {
        console.log("Failed to get guild data for user", session.user.id);

        // Fallback to session nickname
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

      // IMPORTANT: Prioritize guild nickname from API, then session nickname, then username
      const guildNickname =
        guildData.nick || session.user.nickname || session.user.name;

      console.log(
        `Using guild nickname: ${guildNickname} for user ${session.user.id}`
      );

      // Update player with guild nickname
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

      // If Discord API fails, still update with existing nickname from session
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
