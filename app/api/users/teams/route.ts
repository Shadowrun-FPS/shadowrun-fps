import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { getAllTeamCollectionNames } from "@/lib/team-collections";
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity } from "@/lib/api-wrapper";

// Add this line to mark route as dynamic
export const dynamic = "force-dynamic";

async function getUserTeamsHandler(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json(
      { error: "You must be logged in to view your teams" },
      { status: 401 }
    );
  }

  const userId = sanitizeString(session.user.id, 50);
  const client = await clientPromise;
  const db = client.db();

  const { searchParams } = new URL(request.url);
  const includeAll = searchParams.get("all") === "true";

    const allCollections = getAllTeamCollectionNames();
    const captainTeams: any[] = [];
    const memberTeams: any[] = [];
    
    // Fetch both captain and member teams in parallel if needed
    if (includeAll) {
      await Promise.all(
        allCollections.map(async (collectionName) => {
          const [captain, member] = await Promise.all([
            db.collection(collectionName).find({
              "captain.discordId": userId,
            }).toArray(),
            db.collection(collectionName).find({
              "members.discordId": userId,
            }).toArray(),
          ]);
          captainTeams.push(...captain);
          memberTeams.push(...member);
        })
      );
    } else {
      // Only fetch captain teams (backward compatibility)
      for (const collectionName of allCollections) {
        const teams = await db
          .collection(collectionName)
          .find({
            "captain.discordId": userId,
          })
          .toArray();
        captainTeams.push(...teams);
      }
    }

    // Convert ObjectId to string
    const formattedCaptainTeams = captainTeams.map((team) => ({
      ...team,
      _id: team._id.toString(),
    }));

    if (includeAll) {
      const formattedMemberTeams = memberTeams.map((team) => ({
        ...team,
        _id: team._id.toString(),
      }));
      
      // Remove duplicates (user might be captain and member of same team)
      const teamIds = new Set(formattedCaptainTeams.map((t: any) => t._id));
      const uniqueMemberTeams = formattedMemberTeams.filter(
        (t: any) => !teamIds.has(t._id)
      );

      return NextResponse.json({
        teams: [...formattedCaptainTeams, ...uniqueMemberTeams],
        captainTeams: formattedCaptainTeams,
        memberTeams: uniqueMemberTeams,
      });
    }

    const response = NextResponse.json({
      teams: formattedCaptainTeams,
    });
    response.headers.set(
      "Cache-Control",
      "private, no-cache, no-store, must-revalidate"
    );
    return response;
}

export const GET = withApiSecurity(getUserTeamsHandler, {
  rateLimiter: "api",
  requireAuth: true,
});
