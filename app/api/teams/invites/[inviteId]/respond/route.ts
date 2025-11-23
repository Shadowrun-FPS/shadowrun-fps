import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId, UpdateFilter, Document } from "mongodb";
import { recalculateTeamElo } from "@/lib/team-elo-calculator";

export async function POST(
  req: NextRequest,
  { params }: { params: { inviteId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { db } = await connectToDatabase();
    const inviteId = params.inviteId;
    const { action } = await req.json();

    if (!["accept", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be 'accept' or 'reject'" },
        { status: 400 }
      );
    }

    // Get the invite
    const invite = await db.collection("TeamInvites").findOne({
      _id: new ObjectId(inviteId),
      inviteeId: session.user.id,
      status: "pending",
    });

    if (!invite) {
      return NextResponse.json(
        { error: "Invite not found or already processed" },
        { status: 404 }
      );
    }

    // If rejecting, simply update the invite status
    if (action === "reject") {
      await db
        .collection("TeamInvites")
        .updateOne(
          { _id: new ObjectId(inviteId) },
          { $set: { status: "rejected" } }
        );

      // Notify the team captain
      await db.collection("Notifications").insertOne({
        userId: invite.inviterId,
        type: "invite_rejected",
        title: "Team Invite Rejected",
        message: `${
          session.user.nickname || session.user.name
        } has rejected your invitation to join team "${invite.teamName}"`,
        read: false,
        createdAt: new Date(),
        metadata: {
          teamId: invite.teamId.toString(),
          teamName: invite.teamName,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Invite rejected successfully",
      });
    }

    // For accepting the invite, check if the team is full
    const team = await db.collection("Teams").findOne({
      _id: invite.teamId,
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    const teamSize = team.teamSize || 4;

    // Check if team is full
    if (team.members.length >= teamSize) {
      // Update invite status to show it's invalid now
      await db
        .collection("TeamInvites")
        .updateOne(
          { _id: new ObjectId(inviteId) },
          { $set: { status: "cancelled" } }
        );

      return NextResponse.json(
        { error: `Team is already full (${teamSize} players maximum)` },
        { status: 400 }
      );
    }

    // Check if already a member
    const alreadyMember = team.members.some(
      (m: any) => m.discordId === session.user.id
    );
    if (alreadyMember) {
      return NextResponse.json(
        { error: "You are already a member of this team" },
        { status: 400 }
      );
    }

    // Check if user is already in another team of the SAME size
    const existingTeamOfSameSize = await db.collection("Teams").findOne({
      "members.discordId": session.user.id,
      teamSize: teamSize,
      _id: { $ne: invite.teamId }, // Exclude the team being joined
    });

    if (existingTeamOfSameSize) {
      return NextResponse.json(
        { 
          error: `You are already in a ${teamSize}-person team (${existingTeamOfSameSize.name}). Players can only be in one team per team size.` 
        },
        { status: 400 }
      );
    }

    // Update invite status
    await db
      .collection("TeamInvites")
      .updateOne(
        { _id: new ObjectId(inviteId) },
        { $set: { status: "accepted" } }
      );

    // Add user to team
    const newMember = {
      discordId: session.user.id,
      discordNickname: session.user.nickname || session.user.name,
      discordUsername: session.user.name,
      discordProfilePicture: session.user.image || "",
      role: "member",
      joinedAt: new Date(),
    };

    // Create the update document
    const updateDoc = {
      $push: {
        members: newMember,
      },
    };

    // Cast it to the proper MongoDB type
    const typedUpdateDoc = updateDoc as unknown as UpdateFilter<Document>;

    // Use the typed update document in the MongoDB operation
    // (team is already fetched above for the full check)
    await db
      .collection("Teams")
      .updateOne({ _id: invite.teamId }, typedUpdateDoc);

    // Notify the team captain
    await db.collection("Notifications").insertOne({
      userId: invite.inviterId,
      type: "invite_accepted",
      title: "Team Invite Accepted",
      message: `${
        session.user.nickname || session.user.name
      } has accepted your invitation to join team "${invite.teamName}"`,
      read: false,
      createdAt: new Date(),
      metadata: {
        teamId: invite.teamId.toString(),
        teamName: invite.teamName,
        teamTag: team?.tag,
      },
    });

    // Cancel all other pending invites for this user
    await db.collection("TeamInvites").updateMany(
      {
        inviteeId: session.user.id,
        status: "pending",
        _id: { $ne: new ObjectId(inviteId) },
      },
      { $set: { status: "cancelled" } }
    );

    // Recalculate team ELO with the new member
    try {
      await recalculateTeamElo(invite.teamId.toString());
    } catch (eloError) {
      // Log error but don't fail the invite acceptance
      console.error("Error recalculating team ELO after invite acceptance:", eloError);
    }

    return NextResponse.json({
      success: true,
      message: "Successfully joined the team",
      teamTag: team?.tag || null,
    });
  } catch (error) {
    console.error("Error responding to team invite:", error);
    return NextResponse.json(
      { error: "Failed to process invite response" },
      { status: 500 }
    );
  }
}
