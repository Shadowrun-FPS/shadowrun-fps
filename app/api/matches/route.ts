import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const status = searchParams.get("status") || "all";
    const eloTier = searchParams.get("eloTier") || "all";
    const teamSize = searchParams.get("teamSize") || "all";
    const playerSearch = searchParams.get("playerSearch") || "";
    const date = searchParams.get("date");

    const client = await clientPromise;
    const db = client.db("ShadowrunWeb");

    // Build query
    const query: any = {};
    if (status !== "all") query.status = status;
    if (eloTier !== "all") query.eloTier = eloTier;
    if (teamSize !== "all") query.teamSize = parseInt(teamSize.charAt(0));
    if (date) {
      const dateObj = new Date(date);
      query.createdAt = {
        $gte: dateObj.setHours(0, 0, 0, 0),
        $lt: dateObj.setHours(23, 59, 59, 999),
      };
    }

    const limit = 10;
    const skip = (page - 1) * limit;

    const [matches, total] = await Promise.all([
      db
        .collection("Matches")
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      db.collection("Matches").countDocuments(query),
    ]);

    const formattedMatches = matches.map((match) => {
      let createdAt = match.createdAt;
      if (typeof createdAt === "string") {
        createdAt = new Date(createdAt).getTime();
      } else if (createdAt instanceof Date) {
        createdAt = createdAt.getTime();
      }

      // Format ELO tier with proper capitalization
      const formattedEloTier =
        match.eloTier?.charAt(0).toUpperCase() +
        match.eloTier?.slice(1).toLowerCase();

      return {
        ...match,
        _id: match._id.toString(),
        createdAt: createdAt || Date.now(),
        eloTier: formattedEloTier || "Unknown",
      };
    });

    return NextResponse.json({
      matches: formattedMatches,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error("Failed to fetch matches:", error);
    return NextResponse.json(
      { error: "Failed to fetch matches" },
      { status: 500 }
    );
  }
}
