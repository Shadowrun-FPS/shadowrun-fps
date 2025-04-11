import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { recalculateTeamElo } from "@/lib/team-elo-calculator";

export async function POST(
  req: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { memberId } = await req.json();
    if (!memberId) {
      return NextResponse.json(
        { error: "Member ID is required" },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const teamId = params.teamId;

    // Verify the user is the team captain
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

    // Check if the member exists in the team
    const memberExists = team.members.some(
      (m: any) => m.discordId === memberId
    );
    if (!memberExists) {
      return NextResponse.json(
        { error: "Member not found in the team" },
        { status: 404 }
      );
    }

    // Prevent removing yourself as captain through this endpoint
    if (memberId === session.user.id) {
      return NextResponse.json(
        {
          error:
            "Captains cannot remove themselves. Use transfer captain instead.",
        },
        { status: 400 }
      );
    }

    // Remove the member from the team
    await db.collection("Teams").updateOne({ _id: new ObjectId(teamId) }, {
      $pull: { members: { discordId: memberId } },
    } as any);

    // Create notification for the removed member
    await db.collection("Notifications").insertOne({
      userId: memberId,
      type: "team_removed",
      title: "Removed from Team",
      message: `You have been removed from the team "${team.name}" by the team captain.`,
      read: false,
      createdAt: new Date(),
      metadata: {
        teamId,
        teamName: team.name,
      },
    });

    // UPDATED: Use the recalculateTeamElo function to update the team's ELO
    await recalculateTeamElo(teamId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing team member:", error);
    return NextResponse.json(
      { error: "Failed to remove team member" },
      { status: 500 }
    );
  }
}
