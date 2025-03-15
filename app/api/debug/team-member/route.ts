import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const teamId = searchParams.get("teamId");
    const userId = session.user.id;

    if (!teamId) {
      return NextResponse.json({ error: "Team ID required" }, { status: 400 });
    }

    const { db } = await connectToDatabase();

    // Get team data
    const team = await db.collection("Teams").findOne({
      _id: new ObjectId(teamId),
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Check membership
    const memberInfo = team.members.find((m: any) => m.discordId === userId);
    const isMember = !!memberInfo;
    const isCaptain = team.captain?.discordId === userId;

    // Get all user IDs for comparison
    const allMemberIds = team.members.map((m: any) => ({
      id: m.discordId,
      role: m.role,
      matchesCurrentUser: m.discordId === userId,
      matchesWhenLowercase: m.discordId.toLowerCase() === userId.toLowerCase(),
    }));

    return NextResponse.json({
      teamName: team.name,
      currentUserId: userId,
      isMember,
      isCaptain,
      memberInfo,
      allMemberIds,
      rawTeamData: team,
    });
  } catch (error) {
    console.error("Debug API error:", error);
    return NextResponse.json({ error: "Debug API error" }, { status: 500 });
  }
}
