import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { getAllTeamCollectionNames } from "@/lib/team-collections";
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity } from "@/lib/api-wrapper";

export const dynamic = "force-dynamic";

/**
 * All teams the signed-in user is on (captain or member), across team-size collections.
 * Used by the teams directory when `/api/teams` only returns a capped global list (e.g. 100).
 */
async function getMyTeamsHandler(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = sanitizeString(session.user.id, 50);
  const { db } = await connectToDatabase();
  const allCollections = getAllTeamCollectionNames();
  const seen = new Set<string>();
  const out: Record<string, unknown>[] = [];

  try {
    for (const collectionName of allCollections) {
      const batch = await db
        .collection(collectionName)
        .find({
          $or: [
            { "members.discordId": userId },
            { "captain.discordId": userId },
          ],
        })
        .toArray();

      for (const team of batch) {
        const id = team._id.toString();
        if (seen.has(id)) continue;
        seen.add(id);
        out.push({
          ...team,
          _id: id,
        });
      }
    }
  } catch (error) {
    safeLog.error("GET /api/teams/my-teams:", error);
    return NextResponse.json(
      { error: "Failed to load your teams" },
      { status: 500 },
    );
  }

  const res = NextResponse.json(out);
  res.headers.set(
    "Cache-Control",
    "private, no-cache, no-store, must-revalidate",
  );
  return res;
}

export const GET = withApiSecurity(getMyTeamsHandler, {
  rateLimiter: "api",
  requireAuth: true,
});
