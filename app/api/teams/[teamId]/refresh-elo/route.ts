import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { recalculateTeamElo } from "@/lib/team-elo-calculator";
import { SECURITY_CONFIG } from "@/lib/security-config";

export async function POST(
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

    // Validate ObjectId
    if (!ObjectId.isValid(teamId)) {
      return NextResponse.json(
        { error: "Invalid team ID format" },
        { status: 400 }
      );
    }

    // Find the team
    const team = await db.collection("Teams").findOne({
      _id: new ObjectId(teamId),
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    const isAdmin =
      session?.user?.id === SECURITY_CONFIG.DEVELOPER_ID ||
      (Array.isArray(session.user.roles) &&
        session.user.roles.includes("admin"));

    const isTeamCaptain = team.captain.discordId === session.user.id;

    // Also accept the isAdminRequest flag from the request body
    const { isAdminRequest } = await req.json().catch(() => ({}));

    if (!isTeamCaptain && !isAdmin && !isAdminRequest) {
      return NextResponse.json(
        { error: "Only the team captain or admins can refresh team ELO" },
        { status: 403 }
      );
    }

    // Use the shared function to recalculate ELO
    const updatedElo = await recalculateTeamElo(teamId);

    return NextResponse.json({
      success: true,
      teamElo: updatedElo,
    });
  } catch (error) {
    console.error("Error refreshing team ELO:", error);
    return NextResponse.json(
      { error: "Failed to refresh team ELO" },
      { status: 500 }
    );
  }
}
