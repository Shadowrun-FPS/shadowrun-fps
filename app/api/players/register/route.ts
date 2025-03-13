import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import clientPromise from "@/lib/mongodb";
import { authOptions } from "@/lib/auth";

// Add this line to explicitly mark the route as dynamic
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated
    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be signed in to register" },
        { status: 401 }
      );
    }

    const client = await clientPromise;
    const db = client.db("ShadowrunWeb");

    // Check if player already exists
    const existingPlayer = await db.collection("Players").findOne({
      discordId: session.user.id,
    });

    if (existingPlayer) {
      return NextResponse.json(
        { error: "You are already registered" },
        { status: 400 }
      );
    }

    // Create stats for each team size
    const teamSizes = [1, 2, 4, 5];
    const stats = teamSizes.map((teamSize) => ({
      teamSize,
      elo: 800, // Default starting ELO
      wins: 0,
      losses: 0,
      lastMatchDate: new Date(),
    }));

    // Create player document
    const playerDoc = {
      discordId: session.user.id,
      discordUsername: session.user.name || "",
      discordNickname: session.user.nickname || session.user.name || "",
      discordProfilePicture: session.user.image || "",
      stats,
      registeredAt: Date.now(),
    };

    // Insert player into database
    await db.collection("Players").insertOne(playerDoc);

    return NextResponse.json({
      success: true,
      message: "Successfully registered for ranked matchmaking",
    });
  } catch (error) {
    console.error("Error registering player:", error);
    return NextResponse.json(
      { error: "Failed to register for ranked matchmaking" },
      { status: 500 }
    );
  }
}
