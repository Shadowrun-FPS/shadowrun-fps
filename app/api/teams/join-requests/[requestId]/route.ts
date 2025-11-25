import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId, UpdateFilter, Document } from "mongodb";
import { recalculateTeamElo } from "@/lib/team-elo-calculator";
import { ensurePlayerEloForAllTeamSizes } from "@/lib/ensure-player-elo";
import { findTeamAcrossCollections, getTeamCollectionName, getAllTeamCollectionNames } from "@/lib/team-collections";

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

    // Get the team - search across all collections
    const teamResult = await findTeamAcrossCollections(db, joinRequest.teamId);
    if (!teamResult) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }
    const team = teamResult.team;

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
      const teamSize = team.teamSize || 4;

      // Check if user is already in a team of the SAME size
      const collectionName = getTeamCollectionName(teamSize);
      const existingTeamOfSameSize = await db.collection(collectionName).findOne({
        $or: [
          { "members.discordId": joinRequest.userId },
          { "captain.discordId": joinRequest.userId },
        ],
        teamSize: teamSize,
        _id: { $ne: new ObjectId(joinRequest.teamId) }, // Exclude the team they're joining
      });

      if (existingTeamOfSameSize) {
        // Update request status to rejected
        await db.collection("TeamJoinRequests").updateOne(
          { _id: new ObjectId(requestId) },
          {
            $set: {
              status: "rejected",
              updatedAt: new Date(),
              rejectionReason: `User is already in a ${teamSize}-person team`,
            },
          }
        );

        // Notify the user
        await db.collection("Notifications").insertOne({
          userId: joinRequest.userId,
          type: "team_join_rejected",
          title: "Join Request Cannot Be Accepted",
          message: `Your request to join "${team.name}" cannot be accepted because you are already a member of a ${teamSize}-person team "${existingTeamOfSameSize.name}".`,
          read: false,
          createdAt: new Date(),
          metadata: {
            teamId: joinRequest.teamId,
            teamName: team.name,
          },
        });

        // Notify the captain
        await db.collection("Notifications").insertOne({
          userId: team.captain.discordId,
          type: "team_join_request",
          title: "Join Request Auto-Rejected",
          message: `The join request from ${joinRequest.userNickname || joinRequest.userName} was automatically rejected because they are already in a ${teamSize}-person team.`,
          read: false,
          createdAt: new Date(),
          metadata: {
            teamId: joinRequest.teamId,
            teamName: team.name,
            requesterId: joinRequest.userId,
          },
        });

        return NextResponse.json(
          {
            success: false,
            error: `User is already in a ${teamSize}-person team. Request has been rejected.`,
          },
          { status: 400 }
        );
      }

      // Ensure user has ELO records for all team sizes before joining
      await ensurePlayerEloForAllTeamSizes(joinRequest.userId);

      // Get teamSize from joinRequest if stored, otherwise from team
      const requestTeamSize = joinRequest.teamSize || teamSize;

      // Cancel all other pending join requests for teams of the same size
      await db.collection("TeamJoinRequests").updateMany(
        {
          userId: joinRequest.userId,
          status: "pending",
          teamSize: requestTeamSize,
          _id: { $ne: new ObjectId(requestId) }, // Don't cancel the current request
        },
        {
          $set: {
            status: "cancelled",
            updatedAt: new Date(),
            cancellationReason: "User joined another team of the same size",
          },
        }
      );

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
      const teamCollectionName = getTeamCollectionName(teamSize);
      await db
        .collection(teamCollectionName)
        .updateOne(
          { _id: new ObjectId(joinRequest.teamId) },
          { $push: { members: newMember } as any }
        );

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

      // UPDATED: Recalculate team ELO with the new member
      await recalculateTeamElo(joinRequest.teamId);
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
