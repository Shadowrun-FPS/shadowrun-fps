import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(
  request: Request,
  { params }: { params: { matchId: string } }
) {
  try {
    const client = await clientPromise;
    const db = client.db("ShadowrunWeb");

    const match = await db
      .collection("Matches")
      .findOne({ matchId: params.matchId }); // Use matchId instead of _id

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    return NextResponse.json(match);
  } catch (error) {
    console.error("Failed to fetch match:", error);
    return NextResponse.json(
      { error: "Failed to fetch match" },
      { status: 500 }
    );
  }
}
