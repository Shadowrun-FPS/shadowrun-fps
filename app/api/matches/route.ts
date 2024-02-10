import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { Db } from "mongodb";
import { Player } from "@/types/types";

export async function GET(request: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db("ShadowrunWeb");
    const matches = await db.collection("Matches").find().toArray();
    return NextResponse.json({
      ok: true,
      results: matches,
      status: 201,
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      message: "Error getting matches: " + error,
      status: 500,
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const client = await clientPromise;
    const body = await request.json();
    const db = client.db("ShadowrunWeb");
    const action = body.action;
    let response;
    if (action === "addPlayer") {
      const { matchId, player } = body;
      response = handleAddPlayer(db, matchId, player);
    } else if (action === "removePlayer") {
      const { matchId, discordId } = body;
      response = handleRemovePlayer(db, matchId, discordId);
    }

    // const result = await db
    //   .collection("Matches")
    //   .updateOne({ matchId: matchId }, match);
    // console.log("result after update: ", result);

    return NextResponse.json({
      ok: true,
      response,
      status: 201,
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      message: "Error updating match: " + error,
      status: 500,
    });
  }
}

async function handleAddPlayer(db: Db, matchId: string, newPlayer: Player) {
  const result = await db
    .collection("Matches")
    .updateOne({ matchId: matchId }, { $push: { players: newPlayer } });

  console.log("handleAddPlayer result: ", result);
  return result;
}

async function handleRemovePlayer(
  db: Db,
  matchId: string,
  discordIdToRemove: string
) {
  const result = await db
    .collection("Matches")
    .updateOne(
      { matchId: matchId },
      { $pull: { players: { discordId: discordIdToRemove } } }
    );

  console.log("handleRemovePlayer result: ", result);
  return result;
}
