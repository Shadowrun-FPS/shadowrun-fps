import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import clientPromise from "@/lib/mongodb";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated
    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be signed in to check registration" },
        { status: 401 }
      );
    }

    const client = await clientPromise;
    const db = client.db("ShadowrunWeb");

    // Check if player exists
    const player = await db.collection("Players").findOne({
      discordId: session.user.id,
    });

    if (!player) {
      return NextResponse.json(
        { hasPlayer: false, missingTeamSizes: [] },
        { status: 200 }
      );
    }

    // All team sizes that should exist
    const allTeamSizes = [1, 2, 4, 5];

    // Get the team sizes the player already has
    const existingTeamSizes = player.stats.map((stat: any) => stat.teamSize);

    // Find missing team sizes
    const missingTeamSizes = allTeamSizes.filter(
      (size) => !existingTeamSizes.includes(size)
    );

    return NextResponse.json({
      hasPlayer: true,
      missingTeamSizes: missingTeamSizes,
      has4v4: existingTeamSizes.includes(4),
    });
  } catch (error) {
    console.error("Error checking player registration:", error);
    return NextResponse.json(
      { error: "Failed to check registration status" },
      { status: 500 }
    );
  }
}
