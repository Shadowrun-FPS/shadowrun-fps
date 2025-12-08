import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity } from "@/lib/api-wrapper";

async function getTournamentMatchHandler(
  request: NextRequest,
  { params }: { params: { matchId: string } }
) {
  const matchId = sanitizeString(params.matchId, 100);

  const { db } = await connectToDatabase();

  const tournament = await db
    .collection("Tournaments")
    .findOne(
      { "tournamentMatches.tournamentMatchId": matchId },
      { projection: { tournamentMatches: 1, name: 1 } }
    );

  if (!tournament) {
    return NextResponse.json({ error: "Match not found" }, { status: 404 });
  }

  const match = tournament.tournamentMatches.find(
    (m: any) => m.tournamentMatchId === matchId
  );

  if (!match) {
    return NextResponse.json({ error: "Match not found" }, { status: 404 });
  }

  const response = NextResponse.json({
    match,
    tournamentName: tournament.name,
  });
  response.headers.set(
    "Cache-Control",
    "public, s-maxage=300, stale-while-revalidate=1800"
  );
  return response;
}

export const GET = withApiSecurity(getTournamentMatchHandler, {
  rateLimiter: "api",
  cacheable: true,
  cacheMaxAge: 300,
});
