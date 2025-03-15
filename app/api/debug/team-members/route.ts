export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const teamId = searchParams.get("teamId");

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

    // Get member details for debugging
    const memberDetails = team.members.map((m: any) => ({
      id: m.discordId,
      role: m.role,
      username: m.username || m.discordUsername || "Unknown",
      allProperties: Object.keys(m),
    }));

    return NextResponse.json({
      teamId,
      teamName: team.name,
      memberCount: team.members.length,
      captain: team.captain,
      members: memberDetails,
      rawMembers: team.members,
    });
  } catch (error) {
    console.error("Debug API error:", error);
    return NextResponse.json({ error: "Debug API error" }, { status: 500 });
  }
}
