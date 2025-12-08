import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity } from "@/lib/api-wrapper";

export const dynamic = "force-dynamic";

async function getUserRolesHandler(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = sanitizeString(session.user.id, 50);
  const botToken = process.env.DISCORD_BOT_TOKEN;
  const guildId = process.env.DISCORD_GUILD_ID;

  if (!botToken || !guildId) {
    safeLog.error("Missing Discord bot token or guild ID");
    return NextResponse.json({ roles: [], guildNickname: null });
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
      return NextResponse.json({ roles: [], guildNickname: null });
    }

    const memberData = await discordResponse.json();

    const roles = Array.isArray(memberData.roles) ? memberData.roles : [];
    const guildNickname = memberData.nick
      ? sanitizeString(memberData.nick, 100)
      : null;

    const response = NextResponse.json({ roles, guildNickname });
    response.headers.set(
      "Cache-Control",
      "private, s-maxage=60, stale-while-revalidate=120"
    );
    return response;
  } catch (discordError) {
    safeLog.error("Discord API fetch error:", discordError);
    return NextResponse.json({ roles: [], guildNickname: null });
  }
}

export const GET = withApiSecurity(getUserRolesHandler, {
  rateLimiter: "api",
  requireAuth: true,
  cacheable: true,
  cacheMaxAge: 60,
});
