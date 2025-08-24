import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { SECURITY_CONFIG } from "@/lib/security-config";

// POST endpoint to remove seeding from a tournament bracket
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    // Check authentication and admin permission
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be logged in to perform this action" },
        { status: 401 }
      );
    }

    // Check if user is admin
    const client = await clientPromise;
    const db = client.db();

    const user = await db.collection("Users").findOne({
      discordId: session.user.id,
    });

    const { id } = params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid tournament ID" },
        { status: 400 }
      );
    }

    // Get tournament with teams
    const tournament = await db.collection("Tournaments").findOne({
      _id: new ObjectId(id),
    });

    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }

    // Check if the tournament is already launched
    if (tournament.status !== "upcoming") {
      return NextResponse.json(
        { error: "Cannot undo seeding after tournament has started" },
        { status: 400 }
      );
    }

    // Update the admin check to include your specific ID for testing
    const isAdmin =
      user?.roles?.includes("admin") ||
      tournament.createdBy?.discordId === session.user.id ||
      session?.user?.id === SECURITY_CONFIG.DEVELOPER_ID ||
      false;

    if (!isAdmin) {
      return NextResponse.json(
        { error: "You must be an administrator to perform this action" },
        { status: 403 }
      );
    }

    // Create empty rounds structure
    const emptyRounds = [
      {
        name: "Round 1",
        matches: [],
      },
    ];

    // Update tournament to remove seeding
    await db.collection("Tournaments").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          "brackets.rounds": emptyRounds,
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json({
      success: true,
      message: "Tournament seeding has been removed",
    });
  } catch (error) {
    console.error("Error removing tournament seeding:", error);
    return NextResponse.json(
      { error: "Failed to remove tournament seeding" },
      { status: 500 }
    );
  }
}
