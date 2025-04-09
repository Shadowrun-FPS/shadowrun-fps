import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import type { UpdateFilter } from "mongodb";

export async function POST(
  req: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    // Get the current user session
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { db } = await connectToDatabase();
    const teamId = params.teamId;

    // Check that the team exists
    const team = await db.collection("Teams").findOne({
      _id: new ObjectId(teamId),
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Check that the user is a member of the team
    const isMember = team.members.some((m: any) => m.discordId === userId);
    if (!isMember) {
      return NextResponse.json(
        { error: "You are not a member of this team" },
        { status: 400 }
      );
    }

    // Check that the user is not the captain (captains should transfer captaincy instead)
    const isCaptain = team.captain?.discordId === userId;
    if (isCaptain) {
      return NextResponse.json(
        { error: "Team captains must transfer captain role before leaving" },
        { status: 400 }
      );
    }

    // Remove the user from the team using a simple type assertion
    // This is the most direct way to fix the type error
    await db.collection("Teams").updateOne({ _id: new ObjectId(teamId) }, {
      $pull: { members: { discordId: userId } },
    } as any);

    // Create a notification for the team captain
    await db.collection("Notifications").insertOne({
      userId: team.captain.discordId,
      type: "team_member_left",
      title: "Team Member Left",
      message: `${session.user.name || "A team member"} has left your team "${
        team.name
      }"`,
      read: false,
      createdAt: new Date(),
      metadata: {
        teamId: teamId,
        teamName: team.name,
        memberName: session.user.name,
        memberId: userId,
      },
    });

    // Calculate and update team ELO after member leaves
    // Get updated team data
    const updatedTeam = await db.collection("Teams").findOne({
      _id: new ObjectId(teamId),
    });

    if (updatedTeam && updatedTeam.members.length > 0) {
      // Get all remaining member IDs
      const memberIds = updatedTeam.members.map((m: any) => m.discordId);

      // Get player data for all remaining members
      const teamPlayers = await db
        .collection("Players")
        .find({ discordId: { $in: memberIds } })
        .toArray();

      // Calculate total ELO (sum of all members)
      const totalElo = teamPlayers.reduce(
        (sum: number, player: any) => sum + (player.elo || 1000),
        0
      );

      // Update team ELO with the total
      await db
        .collection("Teams")
        .updateOne(
          { _id: new ObjectId(teamId) },
          { $set: { teamElo: totalElo } }
        );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error leaving team:", error);
    return NextResponse.json(
      { error: "Failed to leave team" },
      { status: 500 }
    );
  }
}
