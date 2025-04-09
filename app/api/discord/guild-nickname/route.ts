import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Add this line to make the route dynamic
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Get Discord bot token and guild ID from environment variables
    const botToken = process.env.DISCORD_BOT_TOKEN;
    const guildId = process.env.DISCORD_GUILD_ID;

    if (!botToken || !guildId) {
      console.error("Missing Discord bot token or guild ID");
      return NextResponse.json({ guildNickname: null });
    }

    // Fetch guild member data from Discord API
    try {
      const discordResponse = await fetch(
        `https://discord.com/api/v10/guilds/${guildId}/members/${userId}`,
        {
          headers: {
            Authorization: `Bot ${botToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!discordResponse.ok) {
        console.error(
          `Discord API error: ${discordResponse.status} ${discordResponse.statusText}`
        );
        return NextResponse.json({ guildNickname: null });
      }

      const memberData = await discordResponse.json();
      // Use the nickname from guild data, or null if not present
      const guildNickname = memberData.nick || null;

      return NextResponse.json({ guildNickname });
    } catch (discordError) {
      console.error("Discord API fetch error:", discordError);
      return NextResponse.json({ guildNickname: null });
    }
  } catch (error) {
    console.error("Error fetching guild nickname:", error);
    return NextResponse.json(
      { error: "Failed to fetch guild nickname" },
      { status: 500 }
    );
  }
}
