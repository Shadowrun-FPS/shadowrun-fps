import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ObjectId } from "mongodb";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "You must be signed in to resend a challenge" },
        { status: 401 }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    // Get the scrimmage
    const scrimmage = await db.collection("scrimmages").findOne({
      _id: new ObjectId(params.id),
    });

    if (!scrimmage) {
      return NextResponse.json(
        { error: "Scrimmage not found" },
        { status: 404 }
      );
    }

    // Check if the user is the captain of the challenger team
    const userTeam = await db.collection("teams").findOne({
      "captain.discordId": session.user.id,
    });

    if (!userTeam) {
      return NextResponse.json(
        { error: "You must be a team captain to resend a challenge" },
        { status: 403 }
      );
    }

    if (scrimmage.challengerTeamId.toString() !== userTeam._id.toString()) {
      return NextResponse.json(
        { error: "You can only resend challenges from your own team" },
        { status: 403 }
      );
    }

    // Update the scrimmage status back to pending
    await db
      .collection("scrimmages")
      .updateOne(
        { _id: new ObjectId(params.id) },
        { $set: { status: "pending", updatedAt: new Date() } }
      );

    return NextResponse.json(
      { message: "Challenge resent successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error resending challenge:", error);
    return NextResponse.json(
      { error: "Failed to resend challenge" },
      { status: 500 }
    );
  }
}
