import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET(
  request: NextRequest,
  { params }: { params: { nameString: string } }
) {
  try {
    const client = await clientPromise;
    const db = client.db("ShadowrunWeb");
    const nameString = params.nameString;
    console.log("searching for", nameString);
    const players = await db
      .collection("Players")
      .find({ discordNickname: { $regex: nameString, $options: "i" } })
      .toArray();
    console.log(players);
    return NextResponse.json({
      ok: true,
      players: players,
      status: 201,
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      message: "Error searching for player: " + error,
      status: 500,
    });
  }
}
