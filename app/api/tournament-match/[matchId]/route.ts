import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity } from "@/lib/api-wrapper";

async function getTournamentMatchByIdHandler(
  request: NextRequest,
  { params }: { params: { matchId: string } }
) {
  const matchId = sanitizeString(params.matchId, 200);
  const tournamentId = matchId.split("-R")[0];

  if (!ObjectId.isValid(tournamentId)) {
    return NextResponse.json(
      { error: "Invalid tournament ID" },
      { status: 400 }
    );
  }

  const client = await clientPromise;
  const db = client.db();

  const tournament = await db.collection("Tournaments").findOne({
    _id: new ObjectId(tournamentId),
  });

  if (!tournament) {
    return NextResponse.json(
      { error: "Tournament not found" },
      { status: 404 }
    );
  }

  const match = tournament.tournamentMatches.find(
    (m: any) => m.tournamentMatchId === matchId
  );

  if (!match) {
    return NextResponse.json(
      { error: "Match not found in tournament" },
      { status: 404 }
    );
  }

  match.tournament = {
    name: sanitizeString(tournament.name || "", 200),
    format: sanitizeString(tournament.format || "", 50),
    _id: tournament._id.toString(),
  };

  const response = NextResponse.json(match);
  response.headers.set(
    "Cache-Control",
    "public, s-maxage=30, stale-while-revalidate=60"
  );
  return response;
}

export const GET = withApiSecurity(getTournamentMatchByIdHandler, {
  rateLimiter: "api",
  cacheable: true,
  cacheMaxAge: 30,
});
