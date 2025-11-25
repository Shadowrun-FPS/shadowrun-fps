import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { findTeamAcrossCollections } from "@/lib/team-collections";

export async function GET(
  req: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const teamId = params.teamId;

    // Verify team captain - search across all collections
    const teamResult = await findTeamAcrossCollections(db, teamId);
    if (!teamResult || teamResult.team.captain.discordId !== session.user.id) {
      return NextResponse.json(
        { error: "You are not the captain of this team" },
        { status: 403 }
      );
    }
    const team = teamResult.team;

    // Find pending request
    const joinRequest = await db.collection("TeamJoinRequests").findOne({
      teamId: teamId,
      userId: userId,
      status: "pending",
    });

    if (!joinRequest) {
      return NextResponse.json(
        { error: "No pending join request found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      requestId: joinRequest._id.toString(),
    });
  } catch (error) {
    console.error("Error finding join request:", error);
    return NextResponse.json(
      { error: "Failed to find join request" },
      { status: 500 }
    );
  }
}
