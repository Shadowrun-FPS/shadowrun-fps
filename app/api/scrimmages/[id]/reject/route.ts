import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ObjectId } from "mongodb";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be logged in" },
        { status: 401 }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    const scrimmageId = params.id;

    // Get the scrimmage
    const scrimmage = await db.collection("Scrimmages").findOne({
      _id: new ObjectId(scrimmageId),
    });

    if (!scrimmage) {
      return NextResponse.json(
        { error: "Scrimmage not found" },
        { status: 404 }
      );
    }

    // Get the challenged team
    const challengedTeam = await db.collection("Teams").findOne({
      _id: new ObjectId(scrimmage.challengedTeamId),
    });

    if (!challengedTeam) {
      return NextResponse.json(
        { error: "Challenged team not found" },
        { status: 404 }
      );
    }

    // Check if user is the captain of the challenged team
    if (challengedTeam.captain?.discordId !== session.user.id) {
      return NextResponse.json(
        { error: "Only the team captain can reject challenges" },
        { status: 403 }
      );
    }

    // Check if the scrimmage is in a state that can be rejected
    if (scrimmage.status !== "pending") {
      return NextResponse.json(
        { error: "This challenge cannot be rejected" },
        { status: 400 }
      );
    }

    // Update the scrimmage status to rejected
    await db.collection("Scrimmages").updateOne(
      { _id: new ObjectId(scrimmageId) },
      {
        $set: {
          status: "rejected",
          updatedAt: new Date(),
        },
      }
    );

    // Notify the challenger team captain
    const challengerTeam = await db.collection("Teams").findOne({
      _id: new ObjectId(scrimmage.challengerTeamId),
    });

    if (challengerTeam && challengerTeam.captain) {
      await db.collection("Notifications").insertOne({
        userId: challengerTeam.captain.discordId,
        type: "scrimmage_rejected",
        message: `${challengedTeam.name} has rejected your scrimmage challenge`,
        data: {
          scrimmageId: scrimmageId,
          challengedTeamId: scrimmage.challengedTeamId.toString(),
          challengedTeamName: challengedTeam.name,
        },
        read: false,
        createdAt: new Date(),
      });
    }

    return NextResponse.json({
      message: "Challenge rejected successfully",
    });
  } catch (error) {
    console.error("Error rejecting scrimmage challenge:", error);
    return NextResponse.json(
      { error: "Failed to reject challenge" },
      { status: 500 }
    );
  }
}
