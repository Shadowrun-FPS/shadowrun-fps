import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import clientPromise from "@/lib/mongodb";
import { authOptions } from "@/lib/auth";
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity } from "@/lib/api-wrapper";

export const dynamic = "force-dynamic";

async function getCheckMissingTeamSizesHandler(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json(
      { error: "You must be signed in to check registration" },
      { status: 401 }
    );
  }

  const userId = sanitizeString(session.user.id, 50);
  const client = await clientPromise;
  const db = client.db("ShadowrunWeb");

  const player = await db.collection("Players").findOne({
    discordId: userId,
  });

    if (!player) {
      return NextResponse.json(
        { hasPlayer: false, missingTeamSizes: [] },
        { status: 200 }
      );
    }

    // All team sizes that should exist
    const allTeamSizes = [1, 2, 4, 5];

    // Get the team sizes the player already has
    const existingTeamSizes = player.stats.map((stat: any) => stat.teamSize);

    // Find missing team sizes
    const missingTeamSizes = allTeamSizes.filter(
      (size) => !existingTeamSizes.includes(size)
    );

    const response = NextResponse.json({
      hasPlayer: true,
      missingTeamSizes: missingTeamSizes,
      has4v4: existingTeamSizes.includes(4),
    });
    response.headers.set(
      "Cache-Control",
      "private, no-cache, no-store, must-revalidate"
    );
    return response;
}

export const GET = withApiSecurity(getCheckMissingTeamSizesHandler, {
  rateLimiter: "api",
  requireAuth: true,
});
