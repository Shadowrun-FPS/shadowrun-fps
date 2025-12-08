import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { recalculateTeamElo } from "@/lib/team-elo-calculator";
import { ObjectId } from "mongodb";
import { getAllTeamCollectionNames } from "@/lib/team-collections";
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity } from "@/lib/api-wrapper";

async function getTeamByTagHandler(
  req: NextRequest,
  { params }: { params: { tag: string } }
) {
  const tag = sanitizeString(params.tag, 10);
  if (!tag) {
    return NextResponse.json(
      { error: "Team tag is required" },
      { status: 400 }
    );
  }

  const { db } = await connectToDatabase();

    // Find the team by tag - search across all collections
    const allCollections = getAllTeamCollectionNames();
    let team = null;
    for (const collectionName of allCollections) {
      team = await db.collection(collectionName).findOne({ tag });
      if (team) break;
    }

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Automatically recalculate team ELO based on current member ELOs
    // This ensures team ELO is always up-to-date when the page loads
    if (team.members && team.members.length > 0 && team._id) {
      try {
        const updatedElo = await recalculateTeamElo(team._id.toString());
        // Update team object with fresh ELO
        team.teamElo = updatedElo;
      } catch (error) {
        safeLog.error("Failed to auto-calculate team ELO:", error);
      }
    }

    // Convert ObjectId to string for JSON serialization
    const teamWithStringId = {
      ...team,
      _id: team._id.toString(),
    };

    const response = NextResponse.json(teamWithStringId);
    response.headers.set(
      "Cache-Control",
      "public, s-maxage=300, stale-while-revalidate=1800"
    );
    return response;
}

export const GET = withApiSecurity(getTeamByTagHandler, {
  rateLimiter: "api",
  cacheable: true,
  cacheMaxAge: 300,
});
