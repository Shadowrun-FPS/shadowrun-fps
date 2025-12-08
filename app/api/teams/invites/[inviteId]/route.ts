import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { recalculateTeamElo } from "@/lib/team-elo-calculator";
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity } from "@/lib/api-wrapper";
import { revalidatePath } from "next/cache";

async function putAcceptInviteHandler(
  req: NextRequest,
  { params }: { params: { inviteId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const inviteId = sanitizeString(params.inviteId, 50);
  if (!ObjectId.isValid(inviteId)) {
    return NextResponse.json(
      { error: "Invalid invite ID" },
      { status: 400 }
    );
  }

  const { db } = await connectToDatabase();

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

    revalidatePath("/teams");
    revalidatePath(`/teams/${teamId}`);

    return NextResponse.json({
      success: true,
      message: "Invite accepted",
      teamElo: updatedElo,
    });
}

export const PUT = withApiSecurity(putAcceptInviteHandler, {
  rateLimiter: "api",
  requireAuth: true,
  revalidatePaths: ["/teams"],
});
