import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity, validateBody } from "@/lib/api-wrapper";

async function getTournamentMatchHandler(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const matchIdParam = searchParams.get("id");

  if (!matchIdParam) {
    return NextResponse.json(
      { error: "Match ID is required" },
      { status: 400 }
    );
  }

  const matchId = sanitizeString(matchIdParam, 200);

  if (
    matchId === "[matchId]" ||
    matchId === "%5BmatchId%5D" ||
    matchId === "%255BmatchId%255D"
  ) {
    safeLog.warn("Invalid match ID format", { matchId });
    return NextResponse.json(
      { error: "Invalid match ID format" },
      { status: 400 }
    );
  }

  const client = await clientPromise;
  const db = client.db();

  const tournamentId = matchId.split("-R")[0];
  if (!ObjectId.isValid(tournamentId)) {
    safeLog.warn("Invalid tournament ID extracted from match ID", {
      matchId,
      tournamentId,
    });
    return NextResponse.json(
      { error: "Invalid tournament ID" },
      { status: 400 }
    );
  }

  const tournament = await db.collection("Tournaments").findOne({
    _id: new ObjectId(tournamentId),
  });

  if (!tournament) {
    safeLog.warn("Tournament not found", { tournamentId });
    return NextResponse.json(
      { error: "Tournament not found" },
      { status: 404 }
    );
  }

  safeLog.log("Found tournament match", {
    tournamentId,
    tournamentName: tournament.name,
    matchCount: tournament.tournamentMatches?.length || 0,
  });

    // Find the specific match within the tournament
    if (
      !tournament.tournamentMatches ||
      tournament.tournamentMatches.length === 0
    ) {
      return NextResponse.json(
        { error: "No matches found in tournament" },
        { status: 404 }
      );
    }

    // Look for the match with the matching tournamentMatchId
    const match = tournament.tournamentMatches.find(
      (m: { tournamentMatchId: string }) => m.tournamentMatchId === matchId
    );

    if (!match) {
      safeLog.warn("Match not found in tournament", {
        matchId,
        tournamentId,
        availableMatches: tournament.tournamentMatches.map(
          (m: { tournamentMatchId: string }) => m.tournamentMatchId
        ),
      });

      return NextResponse.json(
        {
          error: "Match not found in tournament",
          availableMatches: tournament.tournamentMatches.map(
            (m: { tournamentMatchId: string }) => m.tournamentMatchId
          ),
        },
        { status: 404 }
      );
    }

    // Enhance with additional team data if needed - search across all collections
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

    // Add tournament info to the response
    match.tournament = {
      name: tournament.name,
      format: tournament.format,
      _id: tournament._id.toString(),
    };

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

async function postTournamentMatchHandler(request: NextRequest) {
  const body = await request.json();
  const validation = validateBody(body, {
    matchId: { type: "string", required: true, maxLength: 200 },
  });

  if (!validation.valid) {
    return NextResponse.json(
      { error: validation.errors?.join(", ") || "Match ID is required" },
      { status: 400 }
    );
  }

  const { matchId } = validation.data! as { matchId: string };
  const sanitizedMatchId = sanitizeString(matchId, 200);

  const client = await clientPromise;
  const db = client.db();

  return NextResponse.json({ success: true });
}

export const POST = withApiSecurity(postTournamentMatchHandler, {
  rateLimiter: "api",
  requireAuth: true,
});
