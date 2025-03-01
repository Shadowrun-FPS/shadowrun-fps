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

    // Try to convert to ObjectId if it's a valid format
    let objectId;
    try {
      objectId = new ObjectId(params.matchId);
    } catch {
      objectId = null;
    }

    const match = await db.collection("Matches").findOne({
      $or: [
        { matchId: params.matchId },
        ...(objectId ? [{ _id: objectId }] : []),
      ],
    });

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    // Transform dates to timestamps
    const transformedMatch = {
      ...match,
      createdAt: new Date(match.createdAt).getTime(),
      completedAt: match.completedAt
        ? new Date(match.completedAt).getTime()
        : undefined,
    };

    return NextResponse.json(transformedMatch);
  } catch (error) {
    console.error("Failed to fetch match:", error);
    return NextResponse.json(
      { error: "Failed to fetch match" },
      { status: 500 }
    );
  }
}
