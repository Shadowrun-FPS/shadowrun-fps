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

    const { response, requestId } = await request.json();

    if (!["accept", "reject"].includes(response)) {
      return NextResponse.json({ error: "Invalid response" }, { status: 400 });
    }

    const { db } = await connectToDatabase();

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

    // Verify user is authorized to respond to changes
    const isTeamACaptain =
      session.user.id === scrimmage.challengingTeam?.captain?.discordId;
    const isTeamBCaptain =
      session.user.id === scrimmage.challengedTeam?.captain?.discordId;

    if (!isTeamACaptain && !isTeamBCaptain) {
      return NextResponse.json(
        { error: "Only team captains can respond to change requests" },
        { status: 403 }
      );
    }

    // Find the change request
    const changeRequest = scrimmage.changeRequests?.find(
      (req: any) => req._id.toString() === requestId
    );

    if (!changeRequest) {
      return NextResponse.json(
        { error: "Change request not found" },
        { status: 404 }
      );
    }

    // Make sure the responding captain is not the one who made the request
    const requestedByTeam = changeRequest.requestedByTeam;
    const respondingTeam = isTeamACaptain ? "teamA" : "teamB";

    if (requestedByTeam === respondingTeam) {
      return NextResponse.json(
        { error: "You cannot respond to your own change request" },
        { status: 400 }
      );
    }

    // Update the change request status
    await db.collection("scrimmages").updateOne(
      {
        _id: new ObjectId(params.id),
        "changeRequests._id": new ObjectId(requestId),
      },
      {
        $set: {
          "changeRequests.$.status": response,
          "changeRequests.$.respondedAt": new Date(),
          "changeRequests.$.respondedBy": session.user.id,
        },
      }
    );

    // If accepted, update the scrimmage with the new details
    if (response === "accept") {
      const updateData: any = { hasActiveChangeRequest: false };

      if (changeRequest.proposedDate) {
        updateData.proposedDate = changeRequest.proposedDate;
      }

      if (changeRequest.proposedMaps) {
        updateData.maps = changeRequest.proposedMaps;
      }

      await db
        .collection("scrimmages")
        .updateOne({ _id: new ObjectId(params.id) }, { $set: updateData });
    } else {
      // If rejected, just mark that there's no active request
      await db
        .collection("scrimmages")
        .updateOne(
          { _id: new ObjectId(params.id) },
          { $set: { hasActiveChangeRequest: false } }
        );
    }

    // Get the updated scrimmage
    const updatedScrimmage = await db.collection("scrimmages").findOne({
      _id: new ObjectId(params.id),
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
