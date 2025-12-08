export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { safeLog, rateLimiters, getClientIdentifier, sanitizeString } from "@/lib/security";
import { cachedQuery } from "@/lib/query-cache";
import { withApiSecurity } from "@/lib/api-wrapper";

async function getMatchesHandler(req: NextRequest) {
  const session = await getServerSession(authOptions);

  const searchParams = req.nextUrl.searchParams;
  const page = Math.max(1, parseInt(sanitizeString(searchParams.get("page") || "1", 10)) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(sanitizeString(searchParams.get("limit") || "10", 10)) || 10));
  const sort = sanitizeString(searchParams.get("sort") || "createdAt", 50);
  const direction = sanitizeString(searchParams.get("direction") || "desc", 10);
  const status = sanitizeString(searchParams.get("status") || "", 50);
  const eloTier = sanitizeString(searchParams.get("eloTier") || "", 50);
  const teamSize = sanitizeString(searchParams.get("teamSize") || "", 10);
  const startDate = sanitizeString(searchParams.get("startDate") || "", 20);
  const endDate = sanitizeString(searchParams.get("endDate") || "", 20);

  // Connect to database
  const { db } = await connectToDatabase();

  // Build query
  const query: any = {};

  // Add filters if provided
  if (status && status !== "all") {
    const normalizedStatus = status.toLowerCase().replace(/-/g, "_");
    query.status = normalizedStatus;
    safeLog.log(`Filtering by status: ${normalizedStatus}`);
  }

  if (eloTier && eloTier !== "all") {
    query.eloTier = sanitizeString(eloTier, 50);
  }

  if (teamSize && teamSize !== "all") {
    const size = parseInt(teamSize.split("v")[0]);
    if (!isNaN(size) && size > 0) {
      query.teamSize = size;
    }
  }

  // Handle date range filtering for Unix timestamps
  if (startDate && endDate) {
    const startTimestamp = parseInt(startDate);
    const endTimestamp = parseInt(endDate);
    if (!isNaN(startTimestamp) && !isNaN(endTimestamp)) {
      query.createdAt = {
        $gte: startTimestamp,
        $lte: endTimestamp,
      };
    }
  }

  // Create cache key
  const cacheKey = `matches:${JSON.stringify(query)}:${page}:${limit}:${sort}:${direction}`;

  // Use cached query
  const result = await cachedQuery(
    cacheKey,
    async () => {
      const totalMatches = await db.collection("Matches").countDocuments(query);
      const totalPages = Math.ceil(totalMatches / limit);

      const matches = await db
        .collection("Matches")
        .find(query)
        .sort({ [sort]: direction === "asc" ? 1 : -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray();

      const formattedMatches = matches.map((match) => ({
        matchId: match.matchId,
        status: match.status,
        teamSize: match.teamSize,
        eloTier: match.eloTier,
        type: match.type,
        createdAt:
          typeof match.createdAt === "number"
            ? match.createdAt
            : new Date(match.createdAt).getTime(),
        winner: match.winner,
        completedAt: match.completedAt
          ? typeof match.completedAt === "number"
            ? match.completedAt
            : new Date(match.completedAt).getTime()
          : undefined,
      }));

      return {
        matches: formattedMatches,
        currentPage: page,
        totalPages,
        totalMatches,
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

export const GET = withApiSecurity(getMatchesHandler, {
  rateLimiter: "api",
  cacheable: true,
  cacheMaxAge: 60,
});
