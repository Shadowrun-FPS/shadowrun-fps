import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { matchId: string } }
) {
  try {
    console.log(`Fetching match with ID: ${params.matchId}`);

    const client = await clientPromise;
    const db = client.db("ShadowrunWeb");

    const match = await db.collection("Matches").findOne({
      matchId: params.matchId,
    });

    if (!match) {
      console.log(`Match not found with ID: ${params.matchId}`);
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    console.log(`Successfully found match: ${match._id}`);
    return NextResponse.json(match);
  } catch (error) {
    console.error("Error fetching match:", error);
    return NextResponse.json(
      { error: "Failed to fetch match" },
      { status: 500 }
    );
  }
}
