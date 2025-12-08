import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity } from "@/lib/api-wrapper";

// Add this line to make the route dynamic
export const dynamic = "force-dynamic";

async function getGuildNicknameHandler(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const userIdParam = url.searchParams.get("userId");

  if (!userIdParam) {
    return NextResponse.json(
      { error: "User ID is required" },
      { status: 400 }
    );
  }

  const userId = sanitizeString(userIdParam, 50);
  const botToken = process.env.DISCORD_BOT_TOKEN;
  const guildId = process.env.DISCORD_GUILD_ID;

  if (!botToken || !guildId) {
    safeLog.error("Missing Discord bot token or guild ID");
    return NextResponse.json({ guildNickname: null });
  }

  try {
    const sanitizedGuildId = sanitizeString(guildId, 50);
    const discordResponse = await fetch(
      `https://discord.com/api/v10/guilds/${sanitizedGuildId}/members/${userId}`,
      {
        headers: {
          Authorization: `Bot ${botToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!discordResponse.ok) {
      safeLog.error("Discord API error", {
        status: discordResponse.status,
        statusText: discordResponse.statusText,
      });
      return NextResponse.json({ guildNickname: null });
    }

    const memberData = await discordResponse.json();
    const guildNickname = memberData.nick
      ? sanitizeString(memberData.nick, 100)
      : null;

    const response = NextResponse.json({ guildNickname });
    response.headers.set(
      "Cache-Control",
      "private, s-maxage=60, stale-while-revalidate=120"
    );
    return response;
  } catch (discordError) {
    safeLog.error("Discord API fetch error:", discordError);
    return NextResponse.json({ guildNickname: null });
  }
}

export const GET = withApiSecurity(getGuildNicknameHandler, {
  rateLimiter: "api",
  requireAuth: true,
  cacheable: true,
  cacheMaxAge: 60,
});
