import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// Add this line to mark route as dynamic
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teamSize = Number(searchParams.get("teamSize") || "4");
    const page = Number(searchParams.get("page") || "1");
    const limit = Number(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const sortField = searchParams.get("sortField") || "elo";
    const sortDirection = searchParams.get("sortDirection") || "desc";
    const skip = (page - 1) * limit;

    const client = await clientPromise;
    const db = client.db();
    const collection = db.collection("Players");

    // Build the search filter
    let searchFilter = {};
    if (search) {
      searchFilter = {
        $or: [
          { discordUsername: { $regex: search, $options: "i" } },
          { discordNickname: { $regex: search, $options: "i" } },
          { discordId: { $regex: search, $options: "i" } },
        ],
      };
    }

    // Step 1: First calculate global ranks for all players by team size and ELO
    const rankPipeline = [
      // Filter by team size
      {
        $addFields: {
          teamSizeStats: {
            $filter: {
              input: "$stats",
              as: "stat",
              cond: { $eq: ["$$stat.teamSize", teamSize] },
            },
          },
        },
      },
      {
        $match: {
          "teamSizeStats.0": { $exists: true },
        },
      },
      // Add a simpler field for the stat we care about
      {
        $addFields: {
          teamStat: { $arrayElemAt: ["$teamSizeStats", 0] },
        },
      },
      // Sort by ELO (to calculate ranks)
      {
        $sort: {
          "teamStat.elo": -1,
        },
      },
      // Add global rank
      {
        $group: {
          _id: null,
          players: { $push: "$$ROOT" },
        },
      },
      {
        $unwind: {
          path: "$players",
          includeArrayIndex: "rank",
        },
      },
      {
        $addFields: {
          "players.globalRank": { $add: ["$rank", 1] },
        },
      },
      {
        $replaceRoot: {
          newRoot: "$players",
        },
      },
      // Store all players with their ranks in a temp collection
      {
        $out: "temp_ranked_players",
      },
    ];

    await collection.aggregate(rankPipeline).toArray();

    // Step 2: Now query the temp collection with search and pagination
    const tempCollection = db.collection("temp_ranked_players");
    const queryPipeline = [
      {
        $match: searchFilter,
      },
      {
        $sort: {
          [`teamStat.${
            sortField === "elo"
              ? "elo"
              : sortField === "wins"
              ? "wins"
              : sortField === "losses"
              ? "losses"
              : sortField === "lastMatch"
              ? "lastMatchDate"
              : "elo"
          }`]: sortDirection === "asc" ? 1 : -1,
        },
      },
      {
        $skip: skip,
      },
      {
        $limit: limit,
      },
    ];

    const players = await tempCollection.aggregate(queryPipeline).toArray();

    // Count total results matching the search
    const countResult = await tempCollection.countDocuments(searchFilter);

    // Clean up temp collection
    await db.collection("temp_ranked_players").drop();

    return NextResponse.json({
      players,
      pagination: {
        total: countResult,
        page,
        limit,
        pages: Math.ceil(countResult / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard data" },
      { status: 500 }
    );
  }
}
