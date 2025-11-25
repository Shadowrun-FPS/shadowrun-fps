import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { recalculateTeamElo } from "@/lib/team-elo-calculator";
import { ensurePlayerEloForAllTeamSizes } from "@/lib/ensure-player-elo";
import { findTeamAcrossCollections, getTeamCollectionName } from "@/lib/team-collections";

// Get the status of a join request
export async function GET(
  req: NextRequest,
  { params }: { params: { teamId: string; requestId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { db } = await connectToDatabase();
    const teamId = params.teamId;
    const requestId = params.requestId;

    // Get the join request
    const joinRequest = await db.collection("TeamJoinRequests").findOne({
      _id: new ObjectId(requestId),
      teamId: teamId,
    });

    if (!joinRequest) {
      return NextResponse.json(
        { error: "Join request not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: joinRequest.status || "pending",
    });
  } catch (error) {
    console.error("Error getting join request status:", error);
    return NextResponse.json(
      { error: "Failed to get join request status" },
      { status: 500 }
    );
  }
}

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

    // Verify user is team captain - search across all collections
    const teamResult = await findTeamAcrossCollections(db, teamId);
    if (!teamResult) {
      return NextResponse.json(
        { error: "Team not found" },
        { status: 404 }
      );
    }
    const { team, collectionName } = teamResult;
    
    if (team.captain.discordId !== session.user.id) {
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
      const teamSize = team.teamSize || 4;

      // Check if user is already in a team of the SAME size
      const teamCollectionName = getTeamCollectionName(teamSize);
      const existingTeamOfSameSize = await db.collection(teamCollectionName).findOne({
        $or: [
          { "members.discordId": joinRequest.userId },
          { "captain.discordId": joinRequest.userId },
        ],
        _id: { $ne: new ObjectId(teamId) }, // Exclude the team they're joining
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
            teamId: teamId,
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
            teamId: teamId,
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
      await db
        .collection(collectionName)
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
