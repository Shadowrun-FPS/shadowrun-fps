import { NextRequest, NextResponse } from "next/server";
import { NextApiRequest } from "next";
import clientPromise from "@/lib/mongodb";
import { rowsDefault,  teamSizeDefault} from "@/app/games/leaderboard/common";

export const dynamic = 'force-dynamic'

export async function PlayerQuery(searchParams: {
    page: number;
    sort: string;
    dir: string;
    rows: number;
    teamSize: string;
  }) {
  try {
    const page = searchParams.page;
    const sortOption = getSortOption(searchParams.sort + '');
    const querySortDirection = (searchParams.dir == "asc" ? 1 : -1);
    const teamSizeOption = searchParams.teamSize;
    const playersPerLBPage = searchParams.rows;
    const skipAmount = Math.max(playersPerLBPage * (Number(page) - 1), 0);
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - 2);
    const client = await clientPromise;
    const db = client.db("ShadowrunWeb");
    const data =
      await db.collection('Players')
      .aggregate([
          {
            $project: {
              _id: 0,
              discordId: 1,
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
              discordId: 1,
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

    // console.log(data[0].players[0]);

    return {players: data[0].players, playerCount: data[0].playerCount[0].total};
  } catch (error) {
    console.log("Error fetching from DB for leaderboard stats", error);
    return {players: [], playerCount: 0};
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