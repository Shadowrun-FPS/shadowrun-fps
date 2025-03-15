import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId, UpdateFilter, Document } from "mongodb";

export async function POST(
  req: NextRequest,
  { params }: { params: { inviteId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const inviteId = params.inviteId;
    const { db } = await connectToDatabase();

    // Find the invite
    const invite = await db.collection("TeamInvites").findOne({
      _id: new ObjectId(inviteId),
      inviteeId: session.user.id,
      status: "pending",
    });

    if (!invite) {
      return NextResponse.json(
        { error: "Invalid or expired invite" },
        { status: 404 }
      );
    }

    // Update invite status
    await db
      .collection("TeamInvites")
      .updateOne(
        { _id: new ObjectId(inviteId) },
        { $set: { status: "accepted", acceptedAt: new Date() } }
      );

    // Add user to team with proper profile data
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
    const teamUpdateResult = await db
      .collection("Teams")
      .updateOne({ _id: new ObjectId(invite.teamId) }, typedUpdateDoc);

    // Create notification for team captain
    const team = await db.collection("Teams").findOne({
      _id: new ObjectId(invite.teamId),
    });

    if (team) {
      await db.collection("Notifications").insertOne({
        userId: team.captain.discordId,
        type: "team_invite_accepted",
        title: "Team Invite Accepted",
        message: `${
          session.user.nickname || session.user.name
        } has joined your team`,
        read: false,
        createdAt: new Date(),
        metadata: {
          teamId: invite.teamId.toString(),
          teamName: team.name,
          memberId: session.user.id,
          memberName: session.user.nickname || session.user.name,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "You have successfully joined the team",
    });
  } catch (error) {
    console.error("Error accepting team invite:", error);
    return NextResponse.json(
      { error: "Failed to accept team invite" },
      { status: 500 }
    );
  }
}
