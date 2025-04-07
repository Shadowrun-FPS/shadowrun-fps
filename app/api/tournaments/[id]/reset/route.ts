import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    if (!session.user.isAdmin) {
      return NextResponse.json(
        { error: "Only admins can reset tournaments" },
        { status: 403 }
      );
    }

    const { id } = params;

    const client = await clientPromise;
    const db = client.db();

    const user = await db.collection("Users").findOne({
      discordId: session.user.id,
    });

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid tournament ID" },
        { status: 400 }
      );
    }

    // Get tournament
    const tournament = await db.collection("Tournaments").findOne({
      _id: new ObjectId(id),
    });

    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }

    // Check admin permissions
    const isAdmin =
      user?.roles?.includes("admin") ||
      tournament.createdBy?.discordId === session.user.id ||
      session.user.id === "238329746671271936" || // Add your specific ID for testing
      false;

    if (!isAdmin) {
      return NextResponse.json(
        { error: "You must be an administrator to perform this action" },
        { status: 403 }
      );
    }

    // Update tournament status to upcoming
    await db.collection("Tournaments").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          status: "upcoming",
          updatedAt: new Date(),
        },
      }
    );

    // Reset all match statuses to upcoming
    if (tournament.brackets?.rounds) {
      // Update all matches in all rounds to upcoming status
      for (let i = 0; i < tournament.brackets.rounds.length; i++) {
        await db
          .collection("Tournaments")
          .updateOne(
            { _id: new ObjectId(id) },
            {
              $set: { [`brackets.rounds.${i}.matches.$[].status`]: "upcoming" },
            }
          );
      }
    }

    // Also update any tournament matches in the tournamentMatches array
    if (
      tournament.tournamentMatches &&
      tournament.tournamentMatches.length > 0
    ) {
      await db
        .collection("Tournaments")
        .updateOne(
          { _id: new ObjectId(id) },
          { $set: { "tournamentMatches.$[].status": "upcoming" } }
        );
    }

    return NextResponse.json({
      success: true,
      message: "Tournament reset successfully",
    });
  } catch (error) {
    console.error("Error resetting tournament:", error);
    return NextResponse.json(
      { error: "Failed to reset tournament" },
      { status: 500 }
    );
  }
}
