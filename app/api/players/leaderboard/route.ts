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

    // Calculate date 3 months ago for activity filtering
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const client = await clientPromise;
    const webDb = client.db("ShadowrunWeb");
    const db2 = client.db("ShadowrunDB2");
    const collection = webDb.collection("Players");

    // API endpoint for getting available teamSizes
    if (searchParams.get("getAvailableTeamSizes") === "true") {
      // Check which teamSizes have active players

      // For teamSize 4, check ShadowrunDB2
      const activeTeamSize4 = await db2.collection("players").countDocuments({
        lastMatchDate: { $gte: threeMonthsAgo },
      });

      // For other teamSizes, check ShadowrunWeb
      const pipeline = [
        {
          $unwind: "$stats",
        },
        {
          $match: {
            "stats.lastMatchDate": { $gte: threeMonthsAgo },
          },
        },
        {
          $group: {
            _id: "$stats.teamSize",
            count: { $sum: 1 },
          },
        },
      ];

      const activeTeamSizes = await collection.aggregate(pipeline).toArray();

      // Format the response with all active teamSizes
      const availableTeamSizes = activeTeamSizes.map((item) => item._id);

      // Add teamSize 4 if there are active players
      if (activeTeamSize4 > 0 && !availableTeamSizes.includes(4)) {
        availableTeamSizes.push(4);
      }

      return NextResponse.json({
        availableTeamSizes: availableTeamSizes.sort((a, b) => a - b),
      });
    }

    // For teamSize 4, we need to create a combined dataset with priority for ShadowrunDB2
    if (teamSize === 4) {
      // Step 1: Get all players from ShadowrunWeb with teamSize 4 stats
      const webPlayers = await collection
        .aggregate([
          {
            $addFields: {
              teamSizeStats: {
                $filter: {
                  input: "$stats",
                  as: "stat",
                  cond: { $eq: ["$$stat.teamSize", 4] },
                },
              },
            },
          },
          {
            $match: {
              "teamSizeStats.0": { $exists: true },
            },
          },
          {
            $addFields: {
              teamStat: { $arrayElemAt: ["$teamSizeStats", 0] },
            },
          },
        ])
        .toArray();

      // Step 2: Get all ACTIVE players from ShadowrunDB2 (only those who played in last 3 months)
      const db2Players = await db2
        .collection("players")
        .find({
          rating: { $exists: true },
          lastMatchDate: { $gte: threeMonthsAgo },
        })
        .toArray();

      // Step 3: Create a combined dataset with priority for ShadowrunDB2
      const combinedPlayers = webPlayers.map((webPlayer) => {
        // Find if this player also exists in DB2
        const db2Player = db2Players.find(
          (p) => p.discordId === webPlayer.discordId
        );

        if (db2Player && db2Player.rating !== undefined) {
          // If player exists in DB2, use those stats for teamSize 4
          return {
            ...webPlayer,
            teamStat: {
              teamSize: 4,
              elo: db2Player.rating,
              wins: db2Player.wins || 0,
              losses: db2Player.losses || 0,
              lastMatchDate: db2Player.lastMatchDate,
            },
          };
        }

        // Otherwise, use the original stats
        return webPlayer;
      });

      // Filter out players who haven't played in the last 3 months
      const activePlayers = combinedPlayers.filter((player) => {
        if (!player.teamStat || !player.teamStat.lastMatchDate) return false;
        const lastMatch = new Date(player.teamStat.lastMatchDate);
        return lastMatch >= threeMonthsAgo;
      });

      // Step 4: Also add any players from DB2 that don't exist in webPlayers
      const webPlayerIds = webPlayers.map((p) => p.discordId);
      const uniqueDb2Players = db2Players.filter(
        (p) => !webPlayerIds.includes(p.discordId)
      );

      // Map these to the same format as webPlayers
      const additionalPlayers = uniqueDb2Players.map((p) => ({
        _id: new ObjectId(),
        discordId: p.discordId,
        discordUsername: p.discordUsername || p.discordNickname || "Unknown",
        discordNickname: p.discordNickname || null,
        discordProfilePicture: p.discordProfilePicture || null,
        teamStat: {
          teamSize: 4,
          elo: p.rating,
          wins: p.wins || 0,
          losses: p.losses || 0,
          lastMatchDate: p.lastMatchDate,
        },
      }));

      // Combine all players
      const allPlayers = [...activePlayers, ...additionalPlayers];

      // Sort players by ELO (descending)
      allPlayers.sort((a, b) => b.teamStat.elo - a.teamStat.elo);

      // Add global ranks
      const rankedPlayers = allPlayers.map((player, index) => ({
        ...player,
        globalRank: index + 1,
      }));

      // Apply search filter
      let filteredPlayers = rankedPlayers;
      if (search) {
        const searchRegex = new RegExp(search, "i");
        filteredPlayers = rankedPlayers.filter((p) => {
          // Type guard to ensure we're only accessing properties on objects that have them
          if (
            "discordUsername" in p &&
            "discordNickname" in p &&
            "discordId" in p
          ) {
            return (
              searchRegex.test(p.discordUsername) ||
              searchRegex.test(p.discordNickname) ||
              searchRegex.test(p.discordId)
            );
          }
          return false;
        });
      }

      // Sort by selected field
      filteredPlayers.sort((a, b) => {
        let aValue, bValue;

        // Define a type guard function
        function hasTeamStat(player: any): player is {
          teamStat: { elo: any; wins: any; losses: any; lastMatchDate: any };
        } {
          return player && "teamStat" in player;
        }

        if (sortField === "elo") {
          aValue = hasTeamStat(a) ? a.teamStat.elo : 0;
          bValue = hasTeamStat(b) ? b.teamStat.elo : 0;
        } else if (sortField === "wins") {
          aValue = hasTeamStat(a) ? a.teamStat.wins || 0 : 0;
          bValue = hasTeamStat(b) ? b.teamStat.wins || 0 : 0;
        } else if (sortField === "losses") {
          aValue = hasTeamStat(a) ? a.teamStat.losses || 0 : 0;
          bValue = hasTeamStat(b) ? b.teamStat.losses || 0 : 0;
        } else if (sortField === "lastMatch") {
          aValue =
            hasTeamStat(a) && a.teamStat.lastMatchDate
              ? new Date(a.teamStat.lastMatchDate).getTime()
              : 0;
          bValue =
            hasTeamStat(b) && b.teamStat.lastMatchDate
              ? new Date(b.teamStat.lastMatchDate).getTime()
              : 0;
        } else {
          aValue = hasTeamStat(a) ? a.teamStat.elo : 0;
          bValue = hasTeamStat(b) ? b.teamStat.elo : 0;
        }

        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      });

      // Apply pagination
      const paginatedPlayers = filteredPlayers.slice(skip, skip + limit);

      return NextResponse.json({
        players: paginatedPlayers,
        pagination: {
          total: filteredPlayers.length,
          page,
          limit,
          pages: Math.ceil(filteredPlayers.length / limit),
        },
      });
    } else {
      // For other team sizes, use the original implementation but with activity filtering

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

      // Step 1: First calculate global ranks for ALL ACTIVE players by team size and ELO
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
        // IMPORTANT: Add filter for last 3 months activity
        {
          $match: {
            "teamStat.lastMatchDate": { $gte: threeMonthsAgo },
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
      const tempCollection = webDb.collection("temp_ranked_players");
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
      await webDb.collection("temp_ranked_players").drop();

      return NextResponse.json({
        players,
        pagination: {
          total: countResult,
          page,
          limit,
          pages: Math.ceil(countResult / limit),
        },
      });
    }
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard data" },
      { status: 500 }
    );
  }
}
