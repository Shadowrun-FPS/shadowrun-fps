import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { recalculateTeamElo } from "@/lib/team-elo-calculator";
import { SECURITY_CONFIG } from "@/lib/security-config";
import { findTeamAcrossCollections } from "@/lib/team-collections";
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity, validateBody } from "@/lib/api-wrapper";
import { revalidatePath } from "next/cache";

async function postRefreshEloHandler(
  req: NextRequest,
  { params }: { params: { teamId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const teamId = sanitizeString(params.teamId, 50);
  if (!ObjectId.isValid(teamId)) {
    return NextResponse.json(
      { error: "Invalid team ID format" },
      { status: 400 }
    );
  }

  const { db } = await connectToDatabase();

    // Find the team - search across all collections
    const teamResult = await findTeamAcrossCollections(db, teamId);
    if (!teamResult) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }
    const team = teamResult.team;

    const isAdmin =
      session?.user?.id === SECURITY_CONFIG.DEVELOPER_ID ||
      (Array.isArray(session.user.roles) &&
        session.user.roles.includes("admin"));

    const isTeamCaptain = team.captain.discordId === session.user.id;

    let body;
    try {
      body = await req.json();
    } catch (error) {
      body = {};
    }

    const validation = validateBody(body, {
      isAdminRequest: { type: "boolean", required: false },
    });

    const isAdminRequest = validation.valid && validation.data?.isAdminRequest;

    if (!isTeamCaptain && !isAdmin && !isAdminRequest) {
      return NextResponse.json(
        { error: "Only the team captain or admins can refresh team ELO" },
        { status: 403 }
      );
    }

    // Use the shared function to recalculate ELO
    const updatedElo = await recalculateTeamElo(teamId);

    revalidatePath("/teams");
    revalidatePath(`/teams/${teamId}`);

    return NextResponse.json({
      success: true,
      teamElo: updatedElo,
    });
}

export const POST = withApiSecurity(postRefreshEloHandler, {
  rateLimiter: "api",
  requireAuth: true,
  revalidatePaths: ["/teams"],
});
