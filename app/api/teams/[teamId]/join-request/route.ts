import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(
  req: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { db } = await connectToDatabase();
    const teamId = params.teamId;
    const currentUserId = session.user.id;
    const currentUserName = session.user.name || "Unknown";
    const currentUserImage = session.user.image || "";

    console.log("Team join request:", {
      teamId,
      currentUserId,
      currentUserName,
    });

    // Get the team
    const team = await db.collection("Teams").findOne({
      _id: new ObjectId(teamId),
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Check if user is already a member
    const isMember = team.members.some(
      (member: any) => member.discordId === currentUserId
    );

    if (isMember) {
      return NextResponse.json(
        { error: "You are already a member of this team" },
        { status: 400 }
      );
    }

    // Check if there's a pending request already
    const existingRequest = await db.collection("TeamJoinRequests").findOne({
      teamId: teamId,
      userId: currentUserId,
      status: "pending",
    });

    if (existingRequest) {
      return NextResponse.json(
        { error: "You already have a pending request to join this team" },
        { status: 400 }
      );
    }

    // Create the join request
    await db.collection("TeamJoinRequests").insertOne({
      teamId: teamId,
      teamName: team.name,
      userId: currentUserId,
      userName: currentUserName,
      userImage: currentUserImage,
      status: "pending",
      createdAt: new Date(),
    });

    // First, query for the join request and store the result
    const joinRequest = await db.collection("TeamJoinRequests").findOne({
      teamId: teamId,
      userId: currentUserId,
    });

    // Then check if it exists before using its ID
    if (!joinRequest) {
      return NextResponse.json(
        { error: "Join request not found" },
        { status: 404 }
      );
    }

    // Now use the ID safely since we've confirmed joinRequest is not null
    await db.collection("Notifications").insertOne({
      userId: team.captain.discordId,
      type: "team_join_request",
      title: "Team Join Request",
      message: `${currentUserName} has requested to join your team "${team.name}"`,
      read: false,
      createdAt: new Date(),
      discordUsername: team.captain.discordUsername || "Unknown",
      discordNickname: team.captain.discordNickname || "Unknown",
      metadata: {
        teamId: teamId,
        teamName: team.name,
        userId: currentUserId,
        userName: currentUserName,
        userAvatar: currentUserImage,
        requestId: joinRequest._id.toString(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Join request sent successfully",
    });
  } catch (error) {
    console.error("Error creating team join request:", error);
    return NextResponse.json(
      { error: "Failed to request to join the team" },
      { status: 500 }
    );
  }
}
