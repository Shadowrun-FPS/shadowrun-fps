import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { rowsDefault,  teamSizeDefault} from "@/app/leaderboard/leaderboardDefaults";

export async function GET(request: NextRequest) {
  try {
    const page = (request.nextUrl.searchParams.get("page") ? request.nextUrl.searchParams.get("page") : 1);
    const sortOption = getSortOption(request.nextUrl.searchParams.get("sort") + '');
    const querySortDirection = (request.nextUrl.searchParams.get("dir") == "asc" ? 1 : -1);
    const teamSizeOption = request.nextUrl.searchParams.get("teamSize") ? request.nextUrl.searchParams.get("teamSize") : teamSizeDefault;
    const playersPerLBPage = request.nextUrl.searchParams.get("rows") ? Number(request.nextUrl.searchParams.get("rows")) : rowsDefault;
    const skipAmount = Math.max(playersPerLBPage * (Number(page) - 1), 0);
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - 2);


    if (teamSizeOption != '2') {
      const client = await clientPromise;
      const db = client.db("ShadowrunDB2");
      const players =
        await db.collection("players")
          .aggregate([
            {$project: {"_id": 0, "playerId": "$discordId", "elo": "$rating", "wins": 1, "losses": 1, "lastMatchDate": 1}},
            {$match: {'lastMatchDate': {$gte: cutoffDate}}},
            {$addFields: {"ratio": {$round: [{$divide: ["$wins", {$add: ["$wins", "$losses"]}]}, 2]}}},
            {$sort: {[sortOption]: querySortDirection}}])
          .skip(skipAmount)
          .limit(playersPerLBPage)
          .toArray()

      const activePlayerCount = await db.collection("players").countDocuments({lastMatchDate: {$gte: cutoffDate}});


      return NextResponse.json({
        ok: true,
        players: players,
        playerCount: activePlayerCount,
        status: 201,
      });
    }
    else {
      const client = await clientPromise;
      const db = client.db("ShadowrunWeb");
      const players =
        await db.collection('Stats')
        .aggregate([
            {
              $project: {
                _id: 0,
                playerId: 1,
                "stats": {
                  $filter: {
                    input: "$stats",
                    cond: { 
                      $and: [
                        {$eq: ["$$this.teamSize", Number(teamSizeOption)]},
                        {$gte: ["$$this.lastMatchDate", cutoffDate]}
                      ]
                    }
                  }
                }
              }
            },
            {$unwind: "$stats"},
            {
              $project: {
                playerId: 1,
                lastMatchDate: "$stats.lastMatchDate",
                elo: "$stats.elo",
                wins: "$stats.wins",
                losses: "$stats.losses"
              }
            },
            {$addFields: {"ratio": {$round: [{$divide: ["$wins", {$add: ["$wins", "$losses"]}]}, 2]}}},
            {$sort: {["stats." + sortOption]: querySortDirection}}
          ])
          .toArray();

      return NextResponse.json({
        ok: true,
        players: players,
        playerCount: 4,
        status: 201,
      });
    }
  } catch (error) {
    return NextResponse.json({
      ok: false,
      message: "Error getting players: " + error,
      status: 500,
    });
  }
}

const getSortOption = (sortParam: string) => {
  switch (sortParam) {
    case ("w"):
      return "wins";
    case ("l"):
      return "losses";
    case ("r"):
      return "ratio";
    case ("e"):
    default:
      return "elo";
      // return "rating";
  }
} 