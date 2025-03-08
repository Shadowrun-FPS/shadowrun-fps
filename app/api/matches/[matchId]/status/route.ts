import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import clientPromise from "@/lib/mongodb";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { matchId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated
    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be signed in to update match status" },
        { status: 401 }
      );
    }

    const { status } = await req.json();

    // Validate status
    if (!status || !["draft", "in_progress", "completed"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("ShadowrunWeb");

    // Get the match
    const match = await db.collection("Matches").findOne({
      matchId: params.matchId,
    });

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    // Check if the user is part of the match
    const isPlayerInMatch = [...match.team1, ...match.team2].some(
      (p) => p.discordId === session.user.id
    );

    if (!isPlayerInMatch) {
      return NextResponse.json(
        { error: "You are not part of this match" },
        { status: 403 }
      );
    }

    // Update the match status
    await db
      .collection("Matches")
      .updateOne({ matchId: params.matchId }, { $set: { status } });

    return NextResponse.json({
      success: true,
      message: "Match status updated successfully",
    });
  } catch (error) {
    console.error("Error updating match status:", error);
    return NextResponse.json(
      { error: "Failed to update match status" },
      { status: 500 }
    );
  }
}
