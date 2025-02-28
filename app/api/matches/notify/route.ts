import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function POST(req: NextRequest) {
  try {
    const { matchId, players } = await req.json();
    const client = await clientPromise;
    const db = client.db("ShadowrunWeb");

    // Create notifications for all players
    const notifications = players.map((player: any) => ({
      userId: player.discordId,
      type: "match_ready",
      title: "Match Ready",
      message: "Your match is ready to begin!",
      matchId,
      read: false,
      createdAt: new Date(),
    }));

    await db.collection("Notifications").insertMany(notifications);

    // You could also implement Discord webhook notifications here

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to send match notifications:", error);
    return NextResponse.json(
      { error: "Failed to send notifications" },
      { status: 500 }
    );
  }
}
