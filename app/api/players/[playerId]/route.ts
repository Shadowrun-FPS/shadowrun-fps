import { NextRequest, NextResponse } from "next/server";
import { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { Player, PlayerStats } from "@/types/types";

export async function GET(request: NextApiRequest, response: NextApiResponse) {
  try {
    console.log("In the GET.... dammit");
    const client = await clientPromise;
    const db = client.db("ShadowrunWeb");
    const {playerId} = request.query;
    const stats = await db.collection("Stats").findOne({playerId: playerId});
    return NextResponse.json({
      ok: true,
      stats: stats,
      status: 201,
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      message: "Error getting stats: " + error,
      status: 500,
    });
  }
}

export async function PUT(request: NextRequest, {params}: {params: {playerId: string}}) {
    // Either updates the discordNickname or ONE of the stats (i.e. can update entry for teamSize 4 but not teamSize 4 and teamSize 2 at the same time)
    try {
        const client = await clientPromise;
        const db = client.db("ShadowrunWeb");
        const playerId = params.playerId;
        const currentPlayerInfo = await db.collection("Stats").findOne({playerId: playerId});
        let currentStats = [];
        const updates = await request.json();
        if (updates?.stat && currentPlayerInfo?.stats) {
            let updatedStatAdded = false;
            for (const stat of currentPlayerInfo?.stats) {
              console.log(stat);
              if (stat.teamSize == updates.stat.teamSize) {
                  currentStats.push(updates.stat);
                  updatedStatAdded = true;
              }
              else currentStats.push(stat);
            }
            if (!updatedStatAdded) currentStats.push(updates.stat);
        }
        else currentStats = currentPlayerInfo?.stats;
        const newPlayerInfo ={
          playerId: playerId,
          discordNickname: updates?.discordNickname || currentPlayerInfo?.discordNickname,
          stats: currentStats,
        }
        if ((currentPlayerInfo && currentPlayerInfo.discordNickname != newPlayerInfo.discordNickname) || updates?.stat) {
          const updatedPlayerInfo = await db.collection("Stats").updateOne({playerId: playerId}, {
            $set: {discordNickname: newPlayerInfo.discordNickname, stats: newPlayerInfo.stats}
          });
        }
        return NextResponse.json({
            ok: true,
            stats: newPlayerInfo,
            status: 500,
        })
    } catch (error) {
      return NextResponse.json({
        ok: false,
        message: `Error updating stats for player` + error,
        status: 500,
      });
    }
}