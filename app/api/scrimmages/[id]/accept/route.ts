import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { db } = await connectToDatabase();

    // Get the scrimmage - try by ObjectId first, then by scrimmageId
    let scrimmage = null;
    if (ObjectId.isValid(params.id)) {
      try {
        scrimmage = await db.collection("Scrimmages").findOne({
          _id: new ObjectId(params.id),
        });
      } catch (error) {
        // Invalid ObjectId format, continue to next method
      }
    }

    if (!scrimmage) {
      scrimmage = await db.collection("Scrimmages").findOne({
        scrimmageId: params.id,
      });
    }

    if (!scrimmage) {
      return NextResponse.json(
        { error: "Scrimmage not found" },
        { status: 404 }
      );
    }

    // Fetch the team directly to get the captain info
    const challengedTeam = await db.collection("Teams").findOne({
      _id: new ObjectId(scrimmage.challengedTeamId),
    });

    // Verify user is authorized to accept the scrimmage
    const isAdmin = session.user.roles?.includes("admin");

    // Check if user is captain of challenged team
    const isTeamBCaptain =
      session.user.id === challengedTeam?.captain?.discordId;

    if (!isAdmin && !isTeamBCaptain) {
      return NextResponse.json(
        {
          error:
            "Only the challenged team captain or an admin can accept a challenge",
          userId: session.user.id,
          captainId: challengedTeam?.captain?.discordId,
        },
        { status: 403 }
      );
    }

    // Update the scrimmage status to accepted
    const updateQuery = scrimmage._id 
      ? { _id: scrimmage._id }
      : { scrimmageId: params.id };

    await db.collection("Scrimmages").updateOne(
      updateQuery,
      {
        $set: {
          status: "accepted",
          acceptedAt: new Date(),
          scrimmageId: scrimmage.scrimmageId || new ObjectId().toString(),
        },
      }
    );

    // Get the updated scrimmage
    const updatedScrimmage = await db.collection("Scrimmages").findOne(updateQuery);

    // Get the challenging team captain's ID for notification
    const challengerCaptainId = scrimmage.challengerTeam?.captain?.discordId;

    // Create a notification for the challenging team captain
    if (challengerCaptainId) {
      await db.collection("Notifications").insertOne({
        userId: challengerCaptainId,
        type: "scrimmage_accepted",
        title: "Scrimmage Challenge Accepted",
        message: `${
          scrimmage.challengedTeam?.name
        } has accepted your scrimmage challenge for ${new Date(
          scrimmage.proposedDate
        ).toLocaleDateString()}.`,
        scrimmageId: scrimmage.scrimmageId || scrimmage._id.toString(),
        scrimmageDetails: {
          teamA: scrimmage.challengerTeam?.name,
          teamB: scrimmage.challengedTeam?.name,
          date: scrimmage.proposedDate,
          maps: scrimmage.maps,
        },
        createdAt: new Date(),
        read: false,
      });
    }

    return NextResponse.json(updatedScrimmage);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to accept scrimmage" },
      { status: 500 }
    );
  }
}
