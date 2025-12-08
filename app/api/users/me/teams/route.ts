import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { getAllTeamCollectionNames } from "@/lib/team-collections";
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity } from "@/lib/api-wrapper";
export const dynamic = "force-dynamic";

async function getMeTeamsHandler(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = sanitizeString(session.user.id, 50);
  const { db } = await connectToDatabase();

  const allCollections = getAllTeamCollectionNames();
  const allTeams = [];
  
  for (const collectionName of allCollections) {
    const teams = await db
      .collection(collectionName)
      .find({
        "members.discordId": userId,
      })
      .toArray();
    allTeams.push(...teams);
  }
  
  const teams = allTeams;

  const response = NextResponse.json({ teams });
  response.headers.set(
    "Cache-Control",
    "private, no-cache, no-store, must-revalidate"
  );
  return response;
}

export const GET = withApiSecurity(getMeTeamsHandler, {
  rateLimiter: "api",
  requireAuth: true,
});
