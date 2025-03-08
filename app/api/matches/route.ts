export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get query parameters
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const sort = url.searchParams.get("sort") || "createdAt";
    const direction = url.searchParams.get("direction") || "desc";
    const status = url.searchParams.get("status");
    const eloTier = url.searchParams.get("eloTier");
    const teamSize = url.searchParams.get("teamSize");
    const date = url.searchParams.get("date");

    // Connect to database
    const { db } = await connectToDatabase();

    // Build query
    const query: any = {};

    // Add filters if provided
    if (status && status !== "all") {
      query.status = status;
    }

    if (eloTier && eloTier !== "all") {
      query.eloTier = eloTier;
    }

    if (teamSize && teamSize !== "all") {
      const size = parseInt(teamSize.split("v")[0]);
      query.teamSize = size;
    }

    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);

      query.createdAt = {
        $gte: startDate.getTime(),
        $lte: endDate.getTime(),
      };
    }

    // Find matches where the user is a player in either team
    query.$or = [
      { "team1.discordId": session.user.id },
      { "team2.discordId": session.user.id },
    ];

    // Count total matches for pagination
    const totalMatches = await db.collection("Matches").countDocuments(query);
    const totalPages = Math.ceil(totalMatches / limit);

    // Add debugging to see what's happening
    console.log("User ID:", session.user.id);
    console.log("Query:", JSON.stringify(query));
    console.log("Total matches found:", totalMatches);

    // If no matches are found, let's try a simpler query to see if any matches exist
    if (totalMatches === 0) {
      const allMatches = await db.collection("Matches").countDocuments({});
      console.log("Total matches in collection:", allMatches);

      // Check the structure of a match document
      if (allMatches > 0) {
        const sampleMatch = await db.collection("Matches").findOne({});
        console.log("Sample match structure:", JSON.stringify(sampleMatch));
      }
    }

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
