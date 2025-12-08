import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAllTeamCollectionNames } from "@/lib/team-collections";
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity } from "@/lib/api-wrapper";

export const dynamic = "force-dynamic";

async function getUserTeamDetailedHandler(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json(
      { error: "You must be logged in" },
      { status: 401 }
    );
  }

  const userId = sanitizeString(session.user.id, 50);
  const client = await clientPromise;
  const db = client.db();

  const allCollections = getAllTeamCollectionNames();
  let team = null;
  for (const collectionName of allCollections) {
    team = await db.collection(collectionName).findOne({
      "members.discordId": userId,
    });
    if (team) break;
  }

  if (!team) {
    const response = NextResponse.json({ team: null });
    response.headers.set(
      "Cache-Control",
      "private, no-cache, no-store, must-revalidate"
    );
    return response;
  }

  const response = NextResponse.json({
    team: {
      ...team,
      _id: team._id.toString(),
      members: team.members.map((member: { _id?: any }) => ({
        ...member,
        _id: member._id?.toString(),
      })),
    },
  });
  response.headers.set(
    "Cache-Control",
    "private, no-cache, no-store, must-revalidate"
  );
  return response;
}

export const GET = withApiSecurity(getUserTeamDetailedHandler, {
  rateLimiter: "api",
  requireAuth: true,
});
