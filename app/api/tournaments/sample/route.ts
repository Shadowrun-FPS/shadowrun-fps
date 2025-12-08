import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { safeLog } from "@/lib/security";
import { withApiSecurity } from "@/lib/api-wrapper";

export const dynamic = "force-dynamic";

async function getSampleTournamentHandler(request: NextRequest) {
  const { db } = await connectToDatabase();

  const tournament = await db.collection("tournaments").findOne({
    "tournamentMatches.0": { $exists: true },
  });

  if (!tournament) {
    return NextResponse.json(
      { error: "No tournaments with matches found" },
      { status: 404 }
    );
  }

  const response = NextResponse.json(tournament);
  response.headers.set(
    "Cache-Control",
    "public, s-maxage=60, stale-while-revalidate=300"
  );
  return response;
}

export const GET = withApiSecurity(getSampleTournamentHandler, {
  rateLimiter: "api",
  cacheable: true,
  cacheMaxAge: 60,
});
