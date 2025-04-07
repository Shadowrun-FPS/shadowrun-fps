import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const discordId = params.id;

    if (!discordId) {
      return NextResponse.json(
        { error: "Player ID is required" },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    const player = await db.collection("Players").findOne({ discordId });

    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    return NextResponse.json({
      discordId: player.discordId,
      discordUsername: player.discordUsername,
      discordNickname: player.discordNickname,
      discordProfilePicture: player.discordProfilePicture,
      stats: player.stats || [],
    });
  } catch (error) {
    console.error("Error fetching player:", error);
    return NextResponse.json(
      { error: "Failed to fetch player" },
      { status: 500 }
    );
  }
}
