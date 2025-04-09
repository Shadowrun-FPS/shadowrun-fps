import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { recalculateTeamElo } from "@/lib/team-elo-calculator";

// Inside the PUT handler for accepting team invites
export async function PUT(
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

    // Find the invite
    const invite = await db.collection("TeamInvites").findOne({
      _id: new ObjectId(inviteId),
    });

    if (!invite) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    }

    // Get the teamId from the invite
    const teamId = invite.teamId.toString();

    // After successfully adding the member to the team
    // Recalculate the team's ELO
    const updatedElo = await recalculateTeamElo(teamId);

    return NextResponse.json({
      success: true,
      message: "Invite accepted",
      teamElo: updatedElo,
    });
  } catch (error) {
    console.error("Error accepting team invite:", error);
    return NextResponse.json(
      { error: "Failed to accept team invite" },
      { status: 500 }
    );
  }
}
