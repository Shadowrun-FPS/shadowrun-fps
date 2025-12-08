import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity } from "@/lib/api-wrapper";
export const dynamic = "force-dynamic";

async function getBanStatusHandler() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = sanitizeString(session.user.id, 50);
  const { db } = await connectToDatabase();

  const player = await db.collection("Players").findOne({
    discordId: userId,
  });

    if (!player) {
      // If player doesn't exist, they can't be banned
      return NextResponse.json({ isBanned: false });
    }

    // Check if player is banned
    if (player.isBanned) {
      // Get the most recent ban reason
      let banReason = "No reason provided";
      if (player.bans && player.bans.length > 0) {
        // Sort bans by timestamp (newest first) and get the most recent one
        const sortedBans = [...player.bans].sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        banReason = sortedBans[0].reason || banReason;
      }

      const response = NextResponse.json({
        isBanned: true,
        banReason: sanitizeString(banReason, 500),
        banExpiry: player.banExpiry,
      });
      response.headers.set(
        "Cache-Control",
        "private, no-cache, no-store, must-revalidate"
      );
      return response;
    }

    const response = NextResponse.json({ isBanned: false });
    response.headers.set(
      "Cache-Control",
      "private, no-cache, no-store, must-revalidate"
    );
    return response;
}

export const GET = withApiSecurity(getBanStatusHandler, {
  rateLimiter: "api",
  requireAuth: true,
});
