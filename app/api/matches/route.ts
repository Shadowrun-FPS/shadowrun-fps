import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { socketServer } from "@/lib/socket-server";

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
    const match = body.match;
    const { matchId } = match;
    const db = client.db("ShadowrunWeb");
    // const result = await db
    //   .collection("Matches")
    //   .updateOne({ matchId: matchId }, match);
    // console.log("result after update: ", result);

    return NextResponse.json({
      ok: true,
      match,
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
