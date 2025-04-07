import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { getGuildData, updatePlayerGuildNickname } from "@/lib/discord-helpers";

// Define a type for the Discord user fields we need
interface DiscordUser {
  id: string;
  name?: string | null;
  nickname?: string | null;
  global_name?: string | null;
  image?: string | null;
}

const DEBUG = false; // Set to true only when debugging this specific endpoint

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const accessToken = session.accessToken;
    const userId = session.user.id;

    if (!accessToken) {
      return NextResponse.json(
        { error: "No access token available" },
        { status: 400 }
      );
    }

    // Log the session info for debugging
    if (DEBUG) {
      console.log("Session user:", {
        id: session.user.id,
        name: session.user.name,
        nickname: session.user.nickname,
      });
    }

    // Get fresh guild data with detailed logging
    if (DEBUG) {
      console.log(`Refreshing Discord data for user ${userId}`);
    }
    const guildData = await getGuildData(accessToken);

    // Log the complete raw data in a more readable format
    if (guildData && guildData.rawData) {
      // Log just the relevant fields for clarity
      if (DEBUG) {
        console.log("Guild data fields:", {
          user: guildData.rawData.user,
          nick: guildData.rawData.nick,
          roles: guildData.rawData.roles?.length || 0,
        });
      }
    }

    // CRITICAL FIX: Always use a valid nickname - never null
    // Determine the best nickname with proper fallback chain
    let nickname;
    let source;

    if (session.user.nickname) {
      // If nickname is already in session, use that first
      nickname = session.user.nickname;
      source = "session_nickname";
      if (DEBUG) {
        console.log(`Using existing session nickname: "${nickname}"`);
      }
    } else if (guildData?.nick) {
      // Otherwise use guild nickname from getGuildData
      nickname = guildData.nick;
      source = "guild_nickname";
      if (DEBUG) {
        console.log(`Using guild nickname: "${nickname}"`);
      }
    } else if (session.user.name) {
      // Finally fall back to username
      nickname = session.user.name;
      source = "username_fallback";
      if (DEBUG) {
        console.log(`Using username as fallback: "${nickname}"`);
      }
    } else {
      nickname = "Unknown User";
      source = "default";
    }

    // IMPORTANT: Don't update if nickname is null or empty
    if (!nickname) {
      if (DEBUG) {
        console.log(
          "WARNING: Nickname is null or empty, not updating database"
        );
      }
      return NextResponse.json({
        success: false,
        error: "No valid nickname found",
        source,
      });
    }

    // Debug log right before updating
    if (DEBUG) {
      console.log(
        `About to update player ${userId} with nickname "${nickname}"`
      );
    }

    // Use the dedicated helper to update the player and related documents
    await updatePlayerGuildNickname(userId, nickname);

    return NextResponse.json({
      success: true,
      nickname,
      source,
      userId,
    });
  } catch (error) {
    if (DEBUG) {
      console.error("Error refreshing discord data:", error);
    }
    return NextResponse.json(
      { error: "Failed to refresh discord data" },
      { status: 500 }
    );
  }
}
