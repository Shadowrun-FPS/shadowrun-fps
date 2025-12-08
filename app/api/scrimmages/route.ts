import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ObjectId } from "mongodb";
import { safeLog, rateLimiters, getClientIdentifier, sanitizeString } from "@/lib/security";
import { cachedQuery } from "@/lib/query-cache";
import { withApiSecurity } from "@/lib/api-wrapper";

// Add this line to force dynamic rendering
export const dynamic = "force-dynamic";

async function getScrimmagesHandler(req: NextRequest) {
    // Get current session
    const session = await getServerSession(authOptions);

    // Connect to database
    const { db } = await connectToDatabase();

    const scrimmagesCollection = db.collection("Scrimmages");

    const { searchParams } = new URL(req.url);
    const teamIdParam = sanitizeString(searchParams.get("teamId") || "", 50);

    // Now that we've debugged, let's create proper queries for signed-in and signed-out users
    let query: any;
    let userTeam: any = null;

    // If teamId is provided in query, filter by that team
    if (teamIdParam) {
      query = {
        $or: [
          { challengerTeamId: teamIdParam },
          { challengedTeamId: teamIdParam },
        ],
      };
    } else if (session?.user) {
      // If user is logged in, include pending scrimmages for their team
      // Fetch user's team - search across all collections
      const { getAllTeamCollectionNames } = await import("@/lib/team-collections");
      const allCollections = getAllTeamCollectionNames();
      for (const collectionName of allCollections) {
        userTeam = await db.collection(collectionName).findOne({
          "members.discordId": session.user.id,
        });
        if (userTeam) break;
      }

      if (userTeam) {
        // Include pending scrimmages for the user's team
        query = {
          $or: [
            { status: { $in: ["completed", "accepted"] } },
            {
              status: "pending",
              $or: [
                { challengerTeamId: userTeam._id.toString() },
                { challengedTeamId: userTeam._id.toString() },
              ],
            },
          ],
        };
      } else {
        // User is logged in but not in a team - show only completed/accepted
        query = { status: { $in: ["completed", "accepted"] } };
      }
    } else {
      // Not logged in - only show completed/accepted scrimmages
      query = { status: { $in: ["completed", "accepted"] } };
    }

    const cacheKey = `scrimmages:${teamIdParam || "all"}:${session?.user?.id || "anonymous"}`;

    const result = await cachedQuery(
      cacheKey,
      async () => {
        const scrimmages = await scrimmagesCollection
          .find(query)
          .sort({ proposedDate: -1 })
          .toArray();

        const serializedScrimmages = scrimmages.map((scrimmage) => ({
          ...scrimmage,
          _id: scrimmage._id.toString(),
          challengerTeamId: scrimmage.challengerTeamId?.toString(),
          challengedTeamId: scrimmage.challengedTeamId?.toString(),
        }));

        let serializedUserTeam = null;
        if (!teamIdParam && session?.user && userTeam) {
          serializedUserTeam = {
            ...userTeam,
            _id: userTeam._id.toString(),
            members: userTeam.members?.map((member: any) => ({
              ...member,
              _id: member._id?.toString(),
            })) || [],
          };
        }

        if (teamIdParam) {
          return serializedScrimmages;
        }

        return {
          scrimmages: serializedScrimmages,
          userTeam: serializedUserTeam,
        };
      },
      60 * 1000 // Cache for 1 minute
    );

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
}

export const GET = withApiSecurity(getScrimmagesHandler, {
  rateLimiter: "api",
  cacheable: true,
  cacheMaxAge: 60,
});

