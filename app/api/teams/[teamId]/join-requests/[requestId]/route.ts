import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { recalculateTeamElo } from "@/lib/team-elo-calculator";

// Handle accepting/rejecting join requests
export async function POST(
  req: NextRequest,
  { params }: { params: { teamId: string; requestId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { action } = await req.json();
    if (!action || !["accept", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be 'accept' or 'reject'" },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const teamId = params.teamId;
    const requestId = params.requestId;

    // Verify user is team captain
    const team = await db.collection("Teams").findOne({
      _id: new ObjectId(teamId),
      "captain.discordId": session.user.id,
    });

    if (!team) {
      return NextResponse.json(
        { error: "You are not the captain of this team" },
        { status: 403 }
      );
    }

    // Get the join request
    const joinRequest = await db.collection("TeamJoinRequests").findOne({
      _id: new ObjectId(requestId),
      teamId: teamId,
      status: "pending",
    });

    if (!joinRequest) {
      return NextResponse.json(
        { error: "Join request not found" },
        { status: 404 }
      );
    }

    // Update request status
    await db.collection("TeamJoinRequests").updateOne(
      { _id: new ObjectId(requestId) },
      {
        $set: {
          status: action === "accept" ? "accepted" : "rejected",
          updatedAt: new Date(),
        },
      }
    );

    // If accepting, add the user to the team
    if (action === "accept") {
      // Create the new member object
      const newMember = {
        discordId: joinRequest.userId,
        discordNickname: joinRequest.userNickname || joinRequest.userName,
        discordUsername: joinRequest.userName,
        discordProfilePicture: joinRequest.userAvatar || "",
        role: "member",
        joinedAt: new Date(),
      };

      // Add the user to the team with proper type casting
      await db
        .collection("Teams")
        .updateOne(
          { _id: new ObjectId(teamId) },
          { $push: { members: newMember } as any }
        );

      // Create notification for the user
      await db.collection("Notifications").insertOne({
        userId: joinRequest.userId,
        type: "team_join_accepted",
        title: "Team Join Request Accepted",
        message: `Your request to join team "${team.name}" has been accepted`,
        read: false,
        createdAt: new Date(),
        metadata: {
          teamId: teamId,
          teamName: team.name,
        },
      });

      // Recalculate the team's ELO
      const updatedElo = await recalculateTeamElo(teamId);

      return NextResponse.json({
        success: true,
        action: action,
        message: "Join request accepted",
        teamElo: updatedElo,
      });
    } else {
      // Create notification for the rejected user
      await db.collection("Notifications").insertOne({
        userId: joinRequest.userId,
        type: "team_join_rejected",
        title: "Team Join Request Rejected",
        message: `Your request to join team "${team.name}" has been rejected`,
        read: false,
        createdAt: new Date(),
        metadata: {
          teamId: teamId,
          teamName: team.name,
        },
      });

      return NextResponse.json({
        success: true,
        action: action,
        message: "Join request rejected",
      });
    }
  } catch (error) {
    console.error(`Error ${req.method} join request:`, error);
    return NextResponse.json(
      { error: "Failed to process join request" },
      { status: 500 }
    );
  }
}
