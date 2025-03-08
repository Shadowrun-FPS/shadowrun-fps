export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Make this endpoint accessible without authentication for now
    // We can add proper authentication back later
    // if (!session?.user) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

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
      query.status = status;
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

      console.log("Date filter range:", {
        startTimestamp,
        endTimestamp,
        startDate: new Date(startTimestamp).toISOString(),
        endDate: new Date(endTimestamp).toISOString(),
      });

      // Simplify the query to just check if createdAt is between the timestamps
      query.createdAt = {
        $gte: startTimestamp,
        $lte: endTimestamp,
      };

      // Only add user ID filter if session exists
      if (session?.user?.id) {
        // Add this to the existing user ID filter
        if (!query.$and) {
          query.$and = [];
        }

        // Add the user ID filter
        query.$and.push({
          $or: [
            { "team1.discordId": session.user.id },
            { "team2.discordId": session.user.id },
          ],
        });
      }
    } else if (session?.user?.id) {
      // If no date filter but we have a session, add the user filter directly
      query.$or = [
        { "team1.discordId": session.user.id },
        { "team2.discordId": session.user.id },
      ];
    }

    // Count total matches for pagination
    const totalMatches = await db.collection("Matches").countDocuments(query);
    const totalPages = Math.ceil(totalMatches / limit);

    // Add debugging to see what's happening
    console.log("User ID:", session?.user?.id || "No session");
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

    // After getting matches, log their createdAt values
    console.log("Matches found:", matches.length);
    if (matches.length > 0) {
      console.log("Sample match createdAt:", matches[0].createdAt);
      console.log("Sample match createdAt type:", typeof matches[0].createdAt);
    }

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
