import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    // First, get the player
    const player = await db.collection("Players").findOne({
      _id: new ObjectId(id),
    });

    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    // For each team size, add the globalRank
    if (player.stats && Array.isArray(player.stats)) {
      const teamSizes = [
        ...new Set(player.stats.map((stat: any) => stat.teamSize)),
      ];

      for (const teamSize of teamSizes) {
        // Get all players with this team size, sorted by ELO
        const rankPipeline = [
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
          {
            $addFields: {
              teamStat: { $arrayElemAt: ["$teamSizeStats", 0] },
            },
          },
          {
            $sort: {
              "teamStat.elo": -1,
            },
          },
          {
            $group: {
              _id: null,
              players: { $push: { id: "$_id", elo: "$teamStat.elo" } },
            },
          },
          {
            $unwind: {
              path: "$players",
              includeArrayIndex: "rank",
            },
          },
          {
            $project: {
              _id: 0,
              playerId: "$players.id",
              rank: { $add: ["$rank", 1] },
            },
          },
        ];

        const ranks = await db
          .collection("Players")
          .aggregate(rankPipeline)
          .toArray();
        const playerRank = ranks.find((r) => r.playerId.equals(player._id));

        if (playerRank) {
          // Find the matching stat in player.stats and add globalRank
          for (const stat of player.stats) {
            if (stat.teamSize === teamSize) {
              stat.globalRank = playerRank.rank;
            }
          }
        }
      }
    }

    return NextResponse.json(player);
  } catch (error) {
    console.error("Error fetching player:", error);
    return NextResponse.json(
      { error: "Failed to fetch player data" },
      { status: 500 }
    );
  }
}
