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

    // Try to find the scrimmage by _id first
    let scrimmage = null;
    try {
      scrimmage = await db.collection("Scrimmages").findOne({
        _id: new ObjectId(params.id),
      });
    } catch (error) {
      // If ObjectId conversion fails, it's not a valid ObjectId
      console.log("Not a valid ObjectId, trying scrimmageId");
    }

    // If not found by _id, try to find by scrimmageId
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

    // Get response data
    const data = await request.json();
    const { accept } = data;

    // Verify user is authorized to respond to change request
    const isAdmin = session.user.roles?.includes("admin");
    const isTeamACaptain =
      session.user.id === scrimmage.challengerTeam?.captain?.discordId ||
      scrimmage.challengerTeam?.members?.some(
        (member: any) =>
          member.discordId === session.user.id && member.role === "captain"
      );
    const isTeamBCaptain =
      session.user.id === scrimmage.challengedTeam?.captain?.discordId ||
      scrimmage.challengedTeam?.members?.some(
        (member: any) =>
          member.discordId === session.user.id && member.role === "captain"
      );

    // Check if the user is from the team that didn't request the change
    const requestedByTeam = scrimmage.changeRequest?.requestedByTeam;
    const isOtherTeamCaptain =
      (isTeamACaptain && requestedByTeam === "teamB") ||
      (isTeamBCaptain && requestedByTeam === "teamA");

    if (!isAdmin && !isOtherTeamCaptain) {
      return NextResponse.json(
        { error: "You are not authorized to respond to this change request" },
        { status: 403 }
      );
    }

    // Get the requesting team captain ID for notification
    const requestingTeamCaptainId =
      requestedByTeam === "teamA"
        ? scrimmage.challengerTeam?.captain?.discordId
        : scrimmage.challengedTeam?.captain?.discordId;

    if (accept) {
      // Apply the requested changes
      const updateData: any = {
        "changeRequest.status": "accepted",
        "changeRequest.respondedAt": new Date(),
        "changeRequest.respondedBy": session.user.id,
      };

      // If there's a new date, update the proposedDate
      if (scrimmage.changeRequest?.newDate) {
        updateData.proposedDate = scrimmage.changeRequest.newDate;
      }

      await db
        .collection("Scrimmages")
        .updateOne({ _id: scrimmage._id }, { $set: updateData });

      // Create a notification for the requesting team captain
      if (requestingTeamCaptainId) {
        await db.collection("Notifications").insertOne({
          userId: requestingTeamCaptainId,
          type: "scrimmage_change_accepted",
          title: "Scrimmage Change Accepted",
          message: `Your requested changes to the scrimmage have been accepted.`,
          scrimmageId: scrimmage.scrimmageId || scrimmage._id.toString(),
          createdAt: new Date(),
          read: false,
        });
      }
    } else {
      // Reject the change request
      await db.collection("Scrimmages").updateOne(
        { _id: scrimmage._id },
        {
          $set: {
            "changeRequest.status": "rejected",
            "changeRequest.respondedAt": new Date(),
            "changeRequest.respondedBy": session.user.id,
          },
        }
      );

      // Create a notification for the requesting team captain
      if (requestingTeamCaptainId) {
        await db.collection("Notifications").insertOne({
          userId: requestingTeamCaptainId,
          type: "scrimmage_change_rejected",
          title: "Scrimmage Change Rejected",
          message: `Your requested changes to the scrimmage have been rejected.`,
          scrimmageId: scrimmage.scrimmageId || scrimmage._id.toString(),
          createdAt: new Date(),
          read: false,
        });
      }
    }

    // Get the updated scrimmage
    const updatedScrimmage = await db.collection("Scrimmages").findOne({
      _id: scrimmage._id,
    });

    return NextResponse.json(updatedScrimmage);
  } catch (error) {
    console.error("Error responding to change request:", error);
    return NextResponse.json(
      { error: "Failed to respond to change request" },
      { status: 500 }
    );
  }
}
