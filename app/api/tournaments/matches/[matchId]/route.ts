import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity } from "@/lib/api-wrapper";

async function getTournamentMatchHandler(
  request: NextRequest,
  { params }: { params: { matchId: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json(
      { error: "You must be logged in to access this resource" },
      { status: 401 }
    );
  }

  const matchId = sanitizeString(params.matchId, 200);
  const client = await clientPromise;
  const db = client.db();

    // Find the tournament with this match
    const tournament = await db.collection("Tournaments").findOne({
      "tournamentMatches.tournamentMatchId": matchId,
    });

    if (!tournament) {
      safeLog.warn("No tournament found with match ID", { matchId });

      if (process.env.NODE_ENV === "development") {
        return NextResponse.json({
          tournamentMatchId: matchId,
          tournamentId: "test-tournament",
          status: "upcoming",
          teamA: { name: "Team A", tag: "TA" },
          teamB: { name: "Team B", tag: "TB" },
          maps: [
            { mapName: "Sanctuary", gameMode: "Extraction" },
            { mapName: "Foundation", gameMode: "Attrition" },
            { mapName: "Exchange", gameMode: "Capture the Flag" },
          ],
          mapScores: [],
        });
      }

      return NextResponse.json(
        { error: "Tournament match not found" },
        { status: 404 }
      );
    }

    // Find the specific match
    const match = tournament.tournamentMatches.find(
      (m: any) => m.tournamentMatchId === matchId
    );

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    // Add maps if not present (in a real scenario, you might want to configure these)
    if (!match.maps) {
      match.maps = [
        { mapName: "Sanctuary", gameMode: "Extraction" },
        { mapName: "Foundation", gameMode: "Attrition" },
        { mapName: "Exchange", gameMode: "Capture the Flag" },
      ];
    }

    const response = NextResponse.json(match);
    response.headers.set(
      "Cache-Control",
      "private, s-maxage=30, stale-while-revalidate=60"
    );
    return response;
}

export const GET = withApiSecurity(getTournamentMatchHandler, {
  rateLimiter: "api",
  requireAuth: true,
  cacheable: true,
  cacheMaxAge: 30,
});
