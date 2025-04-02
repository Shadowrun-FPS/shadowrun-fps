export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const sort = searchParams.get("sort") || "createdAt";
    const direction = searchParams.get("direction") || "desc";
    const status = searchParams.get("status");
    const eloTier = searchParams.get("eloTier");
    const teamSize = searchParams.get("teamSize");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Connect to database
    const { db } = await connectToDatabase();

    // Build query
    const query: any = {};

    // Add filters if provided
    if (status && status !== "all") {
      // Normalize status to lowercase and handle hyphenated versions
      const normalizedStatus = status.toLowerCase().replace(/-/g, "_");
      query.status = normalizedStatus;

      // Add logging to debug status filtering
      console.log(`Filtering by status: ${normalizedStatus}`);
    }

    if (eloTier && eloTier !== "all") {
      query.eloTier = eloTier;
    }

    if (teamSize && teamSize !== "all") {
      const size = parseInt(teamSize.split("v")[0]);
      query.teamSize = size;
    }

    // Handle date range filtering for Unix timestamps
    if (startDate && endDate) {
      const startTimestamp = parseInt(startDate);
      const endTimestamp = parseInt(endDate);

      query.createdAt = {
        $gte: startTimestamp,
        $lte: endTimestamp,
      };
    }

    // Count total matches for pagination
    const totalMatches = await db.collection("Matches").countDocuments(query);
    const totalPages = Math.ceil(totalMatches / limit);

    // Get matches with pagination and sorting
    const matches = await db
      .collection("Matches")
      .find(query)
      .sort({ [sort]: direction === "asc" ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    // Convert MongoDB _id to string id
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

    return NextResponse.json({
      matches: formattedMatches,
      currentPage: page,
      totalPages,
      totalMatches,
    });
  } catch (error) {
    console.error("Error fetching matches:", error);
    return NextResponse.json(
      { error: "Failed to fetch matches" },
      { status: 500 }
    );
  }
}
