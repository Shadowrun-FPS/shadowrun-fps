import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { getAllTeamCollectionNames } from "@/lib/team-collections";
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity } from "@/lib/api-wrapper";

export const dynamic = "force-dynamic";

async function getUserTeamHandler(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = sanitizeString(session.user.id, 50);
  const { db } = await connectToDatabase();

  const allCollections = getAllTeamCollectionNames();
  let team = null;
  for (const collectionName of allCollections) {
    team = await db.collection(collectionName).findOne({
      $or: [
        { "members.discordId": userId },
        { "captain.discordId": userId },
      ],
    });
    if (team) break;
  }

  const response = NextResponse.json({
    team: team
      ? {
          id: team._id.toString(),
          name: sanitizeString(team.name || "", 100),
          tag: sanitizeString(team.tag || "", 10),
          memberCount: team.members?.length || 0,
          isCaptain: team.captain?.discordId === userId,
        }
      : null,
  });
  response.headers.set(
    "Cache-Control",
    "private, no-cache, no-store, must-revalidate"
  );
  return response;
}

export const GET = withApiSecurity(getUserTeamHandler, {
  rateLimiter: "api",
  requireAuth: true,
});
