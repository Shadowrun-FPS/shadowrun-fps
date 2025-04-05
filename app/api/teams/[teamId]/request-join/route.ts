import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { v4 as uuidv4 } from "uuid";

export async function POST(
  request: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be logged in to request joining a team" },
        { status: 401 }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    const userId = session.user.id;
    const userName = session.user.name || "Unknown User";
    const teamId = params.teamId;

    // Check that the team exists
    const team = await db.collection("Teams").findOne({
      _id: new ObjectId(teamId),
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Check if user is already a member of the team
    const isMember = team.members.some((m: any) => m.discordId === userId);
    if (isMember) {
      return NextResponse.json(
        { error: "You are already a member of this team" },
        { status: 400 }
      );
    }

    // Check if the team is full (max 5 active members)
    const activeMembers = team.members.filter(
      (m: any) => m.role.toLowerCase() !== "substitute"
    );
    if (activeMembers.length >= 5) {
      return NextResponse.json(
        { error: "This team is full (maximum 5 active members)" },
        { status: 400 }
      );
    }

    // Check if there's already a pending request
    const existingRequest = await db.collection("TeamJoinRequests").findOne({
      teamId: team._id.toString(),
      userId: userId,
      status: "pending",
    });

    if (existingRequest) {
      return NextResponse.json(
        { error: "You already have a pending request to join this team" },
        { status: 400 }
      );
    }

    // Create the join request
    const joinRequestResult = await db
      .collection("TeamJoinRequests")
      .insertOne({
        teamId: team._id.toString(),
        teamName: team.name,
        userId: session.user.id,
        userName: session.user.name,
        userNickname: session.user.nickname || session.user.name,
        userAvatar: session.user.image,
        status: "pending",
        createdAt: new Date(),
      });

    // Create a notification for the team captain with requestId included
    await db.collection("Notifications").insertOne({
      userId: team.captain.discordId,
      type: "team_join_request",
      title: "New Team Join Request",
      message: `${
        session.user.nickname || userName
      } has requested to join your team "${team.name}"`,
      read: false,
      createdAt: new Date(),
      metadata: {
        teamId: teamId,
        teamName: team.name,
        requesterId: userId,
        requesterName: session.user.nickname || userName,
        requestId: joinRequestResult.insertedId.toString(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Join request sent successfully",
    });
  } catch (error) {
    console.error("Error requesting to join team:", error);
    return NextResponse.json(
      { error: "Failed to submit join request" },
      { status: 500 }
    );
  }
}
