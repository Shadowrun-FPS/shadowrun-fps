import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import clientPromise from "@/lib/mongodb";
import { authOptions } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";
import { isAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // Move all top-level await inside this function
    const session = await getServerSession(authOptions);

    // Check if user is authenticated
    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be signed in to create a match" },
        { status: 401 }
      );
    }

    // Check if user has admin permissions
    if (!isAdmin(session.user.id)) {
      return NextResponse.json(
        { error: "You don't have permission to create matches" },
        { status: 403 }
      );
    }

    // Parse the request body
    const data = await req.json();

    // Validate required fields
    if (!data.team1 || !data.team2 || !data.maps) {
      return NextResponse.json(
        { error: "Missing required fields: team1, team2, maps" },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db("ShadowrunWeb");

    // Generate a unique match ID
    const matchId = uuidv4();

    // Create the match document
    const match = {
      matchId,
      status: "in_progress",
      teamSize: data.teamSize || data.team1.length,
      eloTier: data.eloTier || "Open",
      type: data.type || "Custom",
      firstPick: data.firstPick || Math.floor(Math.random() * 2) + 1,
      createdAt: Date.now(),
      createdBy: {
        discordId: session.user.id,
        discordUsername: session.user.name || "",
        discordNickname: session.user.nickname || session.user.name || "",
      },
      maps: data.maps.map((map: any) => ({
        mapName: map.mapName || map.name,
        gameMode: map.gameMode || "Attrition",
        selected: false,
      })),
      team1: data.team1.map((player: any) => ({
        discordId: player.discordId,
        discordUsername: player.discordUsername,
        discordNickname: player.discordNickname || player.discordUsername,
        discordProfilePicture: player.discordProfilePicture,
        initialElo: player.elo || 1500,
        elo: player.elo || 1500,
        eloChange: 0,
        updatedElo: player.elo || 1500,
        isReady: false,
      })),
      team2: data.team2.map((player: any) => ({
        discordId: player.discordId,
        discordUsername: player.discordUsername,
        discordNickname: player.discordNickname || player.discordUsername,
        discordProfilePicture: player.discordProfilePicture,
        initialElo: player.elo || 1500,
        elo: player.elo || 1500,
        eloChange: 0,
        updatedElo: player.elo || 1500,
        isReady: false,
      })),
      eloDifference: 0, // This will be calculated later
    };

    // Insert the match into the database
    await db.collection("Matches").insertOne(match);

    return NextResponse.json({
      success: true,
      message: "Match created successfully",
      matchId,
    });
  } catch (error) {
    console.error("Error creating match:", error);
    return NextResponse.json(
      { error: "Failed to create match" },
      { status: 500 }
    );
  }
}
