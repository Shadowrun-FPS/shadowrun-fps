import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity } from "@/lib/api-wrapper";

async function getTournamentMatchHandler(
  request: NextRequest,
  { params }: { params: { matchId: string } }
) {
  const matchId = sanitizeString(params.matchId, 200);

  const client = await clientPromise;
  const db = client.db();

  const match = await db.collection("TournamentMatches").findOne({
    tournamentMatchId: matchId,
  });

  if (!match) {
    const matchPattern = new RegExp(matchId.split("-R")[0], "i");

    const alternativeMatch = await db
      .collection("TournamentMatches")
      .findOne({
        tournamentMatchId: { $regex: matchPattern },
      });

    if (!alternativeMatch) {
      safeLog.warn("Match not found", { matchId });
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    safeLog.log("Found match with alternative query", { matchId });
    const response = NextResponse.json(alternativeMatch);
    response.headers.set(
      "Cache-Control",
      "public, s-maxage=30, stale-while-revalidate=60"
    );
    return response;
  }

    // Enhance with team data - search across all collections
    const { findTeamAcrossCollections } = await import("@/lib/team-collections");
    
    if (match.teamA?._id) {
      const teamAId = typeof match.teamA._id === "string" ? match.teamA._id : match.teamA._id.toString();
      const teamAResult = await findTeamAcrossCollections(db, teamAId);

      if (teamAResult) {
        match.teamA = {
          ...match.teamA,
          ...teamAResult.team,
          _id: teamAResult.team._id.toString(),
        };
      }
    }

    if (match.teamB?._id) {
      const teamBId = typeof match.teamB._id === "string" ? match.teamB._id : match.teamB._id.toString();
      const teamBResult = await findTeamAcrossCollections(db, teamBId);

      if (teamBResult) {
        match.teamB = {
          ...match.teamB,
          ...teamBResult.team,
          _id: teamBResult.team._id.toString(),
        };
      }
    }

    const response = NextResponse.json(match);
    response.headers.set(
      "Cache-Control",
      "public, s-maxage=30, stale-while-revalidate=60"
    );
    return response;
}

export const GET = withApiSecurity(getTournamentMatchHandler, {
  rateLimiter: "api",
  cacheable: true,
  cacheMaxAge: 30,
});
