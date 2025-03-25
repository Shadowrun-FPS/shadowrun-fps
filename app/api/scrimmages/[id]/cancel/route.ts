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

    // Get the challenger team
    const challengerTeam = await db.collection("Teams").findOne({
      _id: new ObjectId(scrimmage.challengerTeamId),
    });

    if (!challengerTeam) {
      return NextResponse.json(
        { error: "Challenger team not found" },
        { status: 404 }
      );
    }

    // Check if user is the captain of the challenger team
    if (challengerTeam.captain?.discordId !== session.user.id) {
      return NextResponse.json(
        { error: "Only the team captain can cancel challenges" },
        { status: 403 }
      );
    }

    // Check if the scrimmage is in a state that can be cancelled
    if (scrimmage.status !== "pending") {
      return NextResponse.json(
        { error: "This challenge cannot be cancelled" },
        { status: 400 }
      );
    }

    // Update the scrimmage status to cancelled
    await db.collection("Scrimmages").updateOne(
      { _id: new ObjectId(scrimmageId) },
      {
        $set: {
          status: "cancelled",
          updatedAt: new Date(),
        },
      }
    );

    // Notify the challenged team captain
    const challengedTeam = await db.collection("Teams").findOne({
      _id: new ObjectId(scrimmage.challengedTeamId),
    });

    if (challengedTeam && challengedTeam.captain) {
      await db.collection("Notifications").insertOne({
        userId: challengedTeam.captain.discordId,
        type: "scrimmage_cancelled",
        message: `${challengerTeam.name} has cancelled their scrimmage challenge`,
        data: {
          scrimmageId: scrimmageId,
          challengerTeamId: scrimmage.challengerTeamId.toString(),
          challengerTeamName: challengerTeam.name,
        },
        read: false,
        createdAt: new Date(),
      });
    }

    return NextResponse.json({
      message: "Challenge cancelled successfully",
    });
  } catch (error) {
    console.error("Error cancelling scrimmage challenge:", error);
    return NextResponse.json(
      { error: "Failed to cancel challenge" },
      { status: 500 }
    );
  }
}
