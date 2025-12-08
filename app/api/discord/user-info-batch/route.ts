import { NextRequest, NextResponse } from "next/server";
import { getDiscordUserInfoBatch } from "@/lib/discord-user-info";
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity } from "@/lib/api-wrapper";

export const dynamic = "force-dynamic";

async function getDiscordUserInfoBatchHandler(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const idsParam = searchParams.get("ids");

  if (!idsParam) {
    return NextResponse.json(
      { error: "Discord IDs are required" },
      { status: 400 }
    );
  }

  const sanitizedIds = sanitizeString(idsParam, 5000);
  const discordIds = sanitizedIds
    .split(",")
    .map((id) => sanitizeString(id.trim(), 50))
    .filter((id) => id.length > 0);

  if (discordIds.length === 0) {
    return NextResponse.json([]);
  }

  if (discordIds.length > 100) {
    return NextResponse.json(
      { error: "Maximum 100 Discord IDs allowed per request" },
      { status: 400 }
    );
  }

  const userInfoMap = await getDiscordUserInfoBatch(discordIds);

  const result = Array.from(userInfoMap.entries()).map(([discordId, info]) => ({
    discordId: sanitizeString(discordId, 50),
    ...info,
  }));

  const response = NextResponse.json(result);
  response.headers.set(
    "Cache-Control",
    "public, s-maxage=300, stale-while-revalidate=600"
  );
  return response;
}

export const GET = withApiSecurity(getDiscordUserInfoBatchHandler, {
  rateLimiter: "api",
  cacheable: true,
  cacheMaxAge: 300,
});

