import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export const dynamic = "force-dynamic"; // Mark as dynamic route

export async function GET(request: NextRequest) {
  try {
    // Use searchParams instead of URL
    const id = request.nextUrl.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing player ID" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    const player = await db.collection("Players").findOne({
      discordId: id,
    });

    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    return NextResponse.json(player);
  } catch (error) {
    console.error("Error fetching player:", error);
    return NextResponse.json(
      { error: "Failed to fetch player data" },
      { status: 500 }
    );
  }
}
