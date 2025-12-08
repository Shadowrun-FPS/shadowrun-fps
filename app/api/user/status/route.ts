import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { isPlayerBanned } from "@/lib/ban-utils";
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity } from "@/lib/api-wrapper";

export const dynamic = "force-dynamic";

async function getUserStatusHandler(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const userId = sanitizeString(session.user.id, 50);
  const client = await clientPromise;
  const db = client.db();

  const user = await db.collection("Users").findOne({
    discordId: userId,
  });

  if (!user) {
    const response = NextResponse.json({ roles: [] }, { status: 200 });
    response.headers.set(
      "Cache-Control",
      "private, no-cache, no-store, must-revalidate"
    );
    return response;
  }

  const banStatus = await isPlayerBanned(userId);

  const player = await db.collection("Players").findOne({
    discordId: userId,
  });

  if (!player) {
    return NextResponse.json({ error: "Player not found" }, { status: 404 });
  }

  const response = NextResponse.json({
    id: sanitizeString(user.discordId, 50),
    username: sanitizeString(user.username || "", 100),
    roles: Array.isArray(user.roles) ? user.roles : [],
    isBanned: banStatus.isBanned,
    banExpiry: banStatus.isBanned ? banStatus.banExpiry : null,
    nickname: sanitizeString(player.discordNickname || "", 100),
  });
  response.headers.set(
    "Cache-Control",
    "private, no-cache, no-store, must-revalidate"
  );
  return response;
}

export const GET = withApiSecurity(getUserStatusHandler, {
  rateLimiter: "api",
  requireAuth: true,
});
