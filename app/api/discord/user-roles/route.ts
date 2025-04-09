import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const botToken = process.env.DISCORD_BOT_TOKEN;
    const guildId = process.env.DISCORD_GUILD_ID;

    if (!botToken || !guildId) {
      console.error("Missing Discord bot token or guild ID");
      return NextResponse.json({ roles: [], guildNickname: null });
    }

    try {
      // Fetch member data from Discord API
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
        return NextResponse.json({ roles: [], guildNickname: null });
      }

      const memberData = await discordResponse.json();

      // Extract roles and nickname
      const roles = memberData.roles || [];
      const guildNickname = memberData.nick || null;

      return NextResponse.json({ roles, guildNickname });
    } catch (discordError) {
      console.error("Discord API fetch error:", discordError);
      return NextResponse.json({ roles: [], guildNickname: null });
    }
  } catch (error) {
    console.error("Error fetching user roles:", error);
    return NextResponse.json(
      { error: "Failed to fetch user roles" },
      { status: 500 }
    );
  }
}
