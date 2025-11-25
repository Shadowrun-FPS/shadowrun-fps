import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId, Document, WithId } from "mongodb";
import { findTeamAcrossCollections } from "@/lib/team-collections";

// Define an interface for the invite document
interface TeamInvite {
  _id: ObjectId;
  inviteeId: string;
  inviteeName: string;
  inviterId: string;
  inviterName: string;
  inviterNickname?: string;
  status: string;
  createdAt: Date;
  teamId: ObjectId;
}

export async function GET(
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

    // Get the team - search across all collections
    const teamResult = await findTeamAcrossCollections(db, teamId);
    if (!teamResult) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }
    const team = teamResult.team;

    // Verify user is team captain or team member
    const isCaptain = team.captain.discordId === session.user.id;
    const isMember = team.members.some(
      (m: any) => m.discordId === session.user.id
    );

    if (!isCaptain && !isMember) {
      return NextResponse.json(
        { error: "You are not a member of this team" },
        { status: 403 }
      );
    }

    // Get all invites for the team
    const invites = await db
      .collection("TeamInvites")
      .find({
        teamId: new ObjectId(teamId),
      })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({
      invites: invites.map((invite) => ({
        id: invite._id.toString(),
        inviteeId: invite.inviteeId,
        inviteeName: invite.inviteeName,
        inviterId: invite.inviterId,
        inviterName: invite.inviterName,
        inviterNickname: invite.inviterNickname || invite.inviterName,
        status: invite.status,
        createdAt: invite.createdAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching team invites:", error);
    return NextResponse.json(
      { error: "Failed to fetch team invites" },
      { status: 500 }
    );
  }
}
