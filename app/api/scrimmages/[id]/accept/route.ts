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
        { error: "Only the team captain can accept challenges" },
        { status: 403 }
      );
    }

    // Check if the scrimmage is in a state that can be accepted
    if (scrimmage.status !== "pending") {
      return NextResponse.json(
        { error: "This challenge cannot be accepted" },
        { status: 400 }
      );
    }

    // Update the scrimmage status to accepted
    await db.collection("Scrimmages").updateOne(
      { _id: new ObjectId(scrimmageId) },
      {
        $set: {
          status: "accepted",
          updatedAt: new Date(),
        },
      }
    );

    // Create notifications for all members of both teams
    const challengerTeam = await db.collection("Teams").findOne({
      _id: new ObjectId(scrimmage.challengerTeamId),
    });

    if (challengerTeam) {
      const notifications = [
        // Notify challenger team
        ...challengerTeam.members.map((member: any) => ({
          userId: member.discordId,
          type: "scrimmage_accepted",
          message: `${challengedTeam.name} has accepted your scrimmage challenge`,
          data: {
            scrimmageId: scrimmageId,
            challengedTeamId: scrimmage.challengedTeamId.toString(),
            challengedTeamName: challengedTeam.name,
          },
          read: false,
          createdAt: new Date(),
        })),
        // Notify challenged team members (except captain who already knows)
        ...challengedTeam.members
          .filter((member: any) => member.discordId !== session.user.id)
          .map((member: any) => ({
            userId: member.discordId,
            type: "scrimmage_scheduled",
            message: `Your team has a scheduled scrimmage against ${challengerTeam.name}`,
            data: {
              scrimmageId: scrimmageId,
              challengerTeamId: scrimmage.challengerTeamId.toString(),
              challengerTeamName: challengerTeam.name,
            },
            read: false,
            createdAt: new Date(),
          })),
      ];

      if (notifications.length > 0) {
        await db.collection("Notifications").insertMany(notifications);
      }
    }

    return NextResponse.json({
      message: "Challenge accepted successfully",
    });
  } catch (error) {
    console.error("Error accepting scrimmage challenge:", error);
    return NextResponse.json(
      { error: "Failed to accept challenge" },
      { status: 500 }
    );
  }
}
