import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";

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

    // Get complete team data
    const team = await db.collection("Teams").findOne({
      _id: new ObjectId(teamId),
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Get pending invites
    const pendingInvites = await db
      .collection("TeamInvites")
      .find({
        teamId: new ObjectId(teamId),
        status: "pending",
      })
      .toArray();

    // Return detailed information about the team structure
    return NextResponse.json({
      team: {
        id: team._id.toString(),
        name: team.name,
        captain: team.captain,
        members: team.members,
        membersCount: team.members.length,
        uniqueMemberIds: [...new Set(team.members.map((m: any) => m.discordId))]
          .length,
        memberIds: team.members.map((m: any) => m.discordId),
      },
      pendingInvites: {
        count: pendingInvites.length,
        details: pendingInvites.map((invite) => ({
          id: invite._id.toString(),
          inviteeId: invite.inviteeId,
          inviteeName: invite.inviteeName,
          createdAt: invite.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching team debug info:", error);
    return NextResponse.json(
      { error: "Failed to fetch team debug information" },
      { status: 500 }
    );
  }
}
