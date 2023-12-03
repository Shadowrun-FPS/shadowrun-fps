import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET(request: NextRequest) {
  try {
    const client = await clientPromise;
    const searchParams = request.nextUrl.searchParams;
    const playerId = searchParams.get("playerId");
    const db = client.db("ShadowrunWeb");
    const stats = await db.collection("Stats").findOne({ playerId: playerId });
    return NextResponse.json({
      ok: true,
      results: stats,
      status: 201,
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      message: "Error getting player stats: " + error,
      status: 500,
    });
  }
}
