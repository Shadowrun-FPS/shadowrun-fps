import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId, UpdateFilter, Document } from "mongodb";

// Helper function to get a join request by ID
async function getJoinRequest(db: any, requestId: string) {
  return await db.collection("TeamJoinRequests").findOne({
    _id: new ObjectId(requestId),
  });
}

// Handle both accept and reject with the same endpoint
export async function PATCH(
  req: NextRequest,
  { params }: { params: { requestId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { action } = await req.json(); // action should be 'accept' or 'reject'

    if (action !== "accept" && action !== "reject") {
      return NextResponse.json(
        { error: "Invalid action. Must be 'accept' or 'reject'" },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const requestId = params.requestId;

    // Get the join request
    const joinRequest = await getJoinRequest(db, requestId);

    if (!joinRequest) {
      return NextResponse.json(
        { error: "Join request not found" },
        { status: 404 }
      );
    }

    // Get the team
    const team = await db.collection("Teams").findOne({
      _id: new ObjectId(joinRequest.teamId),
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Verify the current user is the team captain
    const isCaptain =
      team.captain?.discordId === session.user.id ||
      team.members.some(
        (m: any) => m.discordId === session.user.id && m.role === "captain"
      );

    if (!isCaptain) {
      return NextResponse.json(
        { error: "Only the team captain can manage join requests" },
        { status: 403 }
      );
    }

    // Update request status based on action
    await db
      .collection("TeamJoinRequests")
      .updateOne(
        { _id: new ObjectId(requestId) },
        { $set: { status: action === "accept" ? "accepted" : "rejected" } }
      );

    if (action === "accept") {
      // Add user to team if accepted
      const memberToAdd = {
        discordId: joinRequest.userId,
        discordNickname: joinRequest.userName,
        discordUsername: joinRequest.userName,
        discordProfilePicture: joinRequest.userImage,
        role: "member",
        joinedAt: new Date(),
      };

      // Create the update document
      const updateDoc = {
        $push: {
          members: memberToAdd,
        },
      };

      // Cast it to the proper MongoDB type
      const typedUpdateDoc = updateDoc as unknown as UpdateFilter<Document>;

      // Use the typed update document in the MongoDB operation
      await db
        .collection("Teams")
        .updateOne({ _id: new ObjectId(joinRequest.teamId) }, typedUpdateDoc);

      // Notify the user that their request was accepted
      await db.collection("Notifications").insertOne({
        userId: joinRequest.userId,
        type: "team_member_joined",
        title: "Join Request Accepted",
        message: `Your request to join ${team.name} has been accepted!`,
        read: false,
        createdAt: new Date(),
        metadata: {
          teamId: joinRequest.teamId,
          teamName: team.name,
        },
      });
    } else {
      // Notify the user that their request was rejected
      await db.collection("Notifications").insertOne({
        userId: joinRequest.userId,
        type: "team_invite",
        title: "Join Request Rejected",
        message: `Your request to join ${team.name} was not accepted.`,
        read: false,
        createdAt: new Date(),
        metadata: {
          teamId: joinRequest.teamId,
          teamName: team.name,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message:
        action === "accept"
          ? "Join request accepted successfully"
          : "Join request rejected successfully",
    });
  } catch (error) {
    console.error(`Error ${req.method} join request:`, error);
    return NextResponse.json(
      { error: "Failed to process join request" },
      { status: 500 }
    );
  }
}
