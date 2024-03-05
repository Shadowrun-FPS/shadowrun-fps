import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { discordId: string } }
) {
  try {
    const client = await clientPromise;
    const db = client.db("ShadowrunWeb");
    const discordId = params.discordId;
    const player = await db
      .collection("Players")
      .findOne({ discordId: discordId });
    return NextResponse.json({
      ok: true,
      player: player,
      status: 201,
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      message: "Error getting player information: " + error,
      status: 500,
    });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { discordId: string } }
) {
  // Can update the discordNickname, discordProfilePicture, or ONE of the stats (i.e. can update entry for teamSize 4 but not teamSize 4 and teamSize 2 at the same time)
  const body = await request.json();
  const action = body.action;
  const data = body.data;
  if (!action || !data)
    return NextResponse.json({
      ok: false,
      message: "Must include an 'action' and some 'data' in the body",
      status: 400,
    });

  const client = await clientPromise;
  const db = client.db("ShadowrunWeb");
  const discordId = params.discordId;
  const currentPlayerInfo = await db
    .collection("Players")
    .findOne({ discordId: discordId });

  if (!currentPlayerInfo)
    return NextResponse.json({
      ok: false,
      message: "User does not exist in the DB",
      status: 400,
    });

  const updatedPlayerInfo = currentPlayerInfo;
  try {
    switch (action) {
      case "update": {
        let discordNickname = data?.discordNickname;
        let discordProfilePicture = data?.discordProfilePicture;
        const newStat = data?.stats;
        if (!discordNickname && !discordProfilePicture && !newStat)
          return NextResponse.json({
            ok: false,
            message:
              "Data object must include discordNickname, discordProfilePicture, or stats object to update user's Discord Info",
            status: 400,
          });
        if (!discordNickname) {
          discordNickname = currentPlayerInfo?.discordNickname;
          updatedPlayerInfo.discordNickname = discordNickname;
        }
        if (!discordProfilePicture) {
          discordProfilePicture = currentPlayerInfo?.discordProfilePicture;
          updatedPlayerInfo.discordProfilePicture = discordProfilePicture;
        }

        let updatedStats = [];
        if (!newStat) {
          updatedStats = currentPlayerInfo.stats;
        } else {
          let updatedStatAdded = false;
          for (const stat of currentPlayerInfo?.stats) {
            if (stat.teamSize == newStat.teamSize) {
              updatedStats.push(newStat);
              updatedStatAdded = true;
            } else updatedStats.push(stat);
          }
          if (!updatedStatAdded) updatedStats.push(newStat);
        }

        await db.collection("Players").updateOne(
          { discordId: discordId },
          {
            $set: {
              discordNickname: discordNickname,
              discordProfilePicture: discordProfilePicture,
              stats: updatedStats,
            },
          }
        );
        updatedPlayerInfo.stats = updatedStats;
        break;
      }
    }
    return NextResponse.json({
      ok: true,
      stats: updatedPlayerInfo,
      status: 500,
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      message: `Error updating stats for player` + error,
      status: 500,
    });
  }
}
