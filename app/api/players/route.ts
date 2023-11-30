import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { rowsDefault,  teamSizeDefault} from "@/app/games/leaderboard/common";

export async function GET(request: NextRequest) {
  try {
    console.log("RUNNING GET");
    console.log(request.nextUrl.href);
    const searchParams = request.nextUrl.searchParams;
    const page = (searchParams.get("page") ? searchParams.get("page") : 1);
    const sortOption = getSortOption(searchParams.get("sort") + '');
    const querySortDirection = (searchParams.get("dir") == "asc" ? 1 : -1);
    const teamSizeOption = searchParams.get("teamSize") ? searchParams.get("teamSize") : teamSizeDefault;
    const playersPerLBPage = searchParams.get("rows") ? Number(searchParams.get("rows")) : rowsDefault;
    const skipAmount = Math.max(playersPerLBPage * (Number(page) - 1), 0);
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - 2);
    console.log("CHECKPOINT 1");
    const client = await clientPromise;
    const db = client.db("ShadowrunWeb");
    console.log("CHECKPOINT 2");
    const data =
      await db.collection('Stats')
      .aggregate([
          {
            $project: {
              _id: 0,
              playerId: 1,
              discordNickname: 1,
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
              discordNickname: 1,
              lastMatchDate: "$stats.lastMatchDate",
              elo: "$stats.elo",
              wins: "$stats.wins",
              losses: "$stats.losses"
            }
          },
          {$addFields: {"ratio": {$round: [{$divide: ["$wins", {$add: ["$wins", "$losses"]}]}, 2]}}},
          {$sort: {[sortOption]: querySortDirection}},
          {$facet: {
            playerCount: [
              {$count: 'total'}
            ],
            players: [
              {$skip: skipAmount},
              {$limit: playersPerLBPage}
            ]
          }}
        ])
        .toArray();
      console.log("CHECKPOINT 3");

    // console.log(data[0].players[0]);
    return NextResponse.json({
      ok: true,
      players: data[0].players,
      playerCount: data[0].playerCount[0].total,
      status: 201,
    });
  } catch (error) {
    console.log("CHECKPOINT 4");
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
  }
} 