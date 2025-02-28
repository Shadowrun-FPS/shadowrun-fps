import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { discordId, discordUsername, discordNickname, image } = body;

    const client = await clientPromise;
    const db = client.db("ShadowrunWeb");

    // Check if player already exists
    const existingPlayer = await db
      .collection("Players")
      .findOne({ discordId });

    if (existingPlayer) {
      return NextResponse.json(
        { error: "Player already registered" },
        { status: 400 }
      );
    }

    // Create new player
    const player = {
      discordId,
      discordUsername,
      discordNickname,
      image,
      elo: {
        "4v4": 800,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.collection("Players").insertOne(player);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to register player:", error);
    return NextResponse.json(
      { error: "Failed to register player" },
      { status: 500 }
    );
  }
}
