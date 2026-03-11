import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId, Document, WithId } from "mongodb";
import { findTeamAcrossCollections } from "@/lib/team-collections";
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity } from "@/lib/api-wrapper";

// Define an interface for the invite document
interface TeamInvite {
  _id: ObjectId;
  inviteeId: string;
  inviteeName: string;
  inviterId: string;
  inviterName: string;
  inviterNickname?: string;
  status: string;
  createdAt: Date;
  teamId: ObjectId;
}

async function getTeamInvitesHandler(
  req: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { teamId: rawTeamId } = await params;
  const teamId = sanitizeString(rawTeamId, 50);
  if (!ObjectId.isValid(teamId)) {
    return NextResponse.json(
      { error: "Invalid team ID" },
      { status: 400 }
    );
  }

  const { db } = await connectToDatabase();

    // Get the team - search across all collections
    const teamResult = await findTeamAcrossCollections(db, teamId);
    if (!teamResult) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }
    const team = teamResult.team;

    // Verify user is team captain or team member
    const isCaptain = team.captain.discordId === session.user.id;
    const isMember = team.members.some(
      (m: any) => m.discordId === session.user.id
    );

    if (!isCaptain && !isMember) {
      return NextResponse.json(
        { error: "You are not a member of this team" },
        { status: 403 }
      );
    }

    // Get all invites for the team
    const invites = await db
      .collection("TeamInvites")
      .find({
        teamId: new ObjectId(teamId),
      })
      .sort({ createdAt: -1 })
      .toArray();

    // Current member IDs (captain + members) so we can mark accepted invites as "left" if they left
    const currentMemberIds = new Set([
      team.captain?.discordId,
      ...(team.members ?? []).map((m: { discordId: string }) => m.discordId),
    ].filter(Boolean));

    // Backfill: accepted invites for users no longer on the team → set status to "left"
    const acceptedButLeft = invites.filter(
      (inv) => inv.status === "accepted" && !currentMemberIds.has(inv.inviteeId)
    );
    if (acceptedButLeft.length > 0) {
      await db.collection("TeamInvites").updateMany(
        {
          teamId: new ObjectId(teamId),
          status: "accepted",
          inviteeId: { $nin: Array.from(currentMemberIds) },
        },
        { $set: { status: "left", updatedAt: new Date() } }
      );
    }

    const response = NextResponse.json({
      invites: invites.map((invite) => {
        const effectiveStatus =
          invite.status === "accepted" && !currentMemberIds.has(invite.inviteeId)
            ? "left"
            : invite.status;
        return {
          id: invite._id.toString(),
          inviteeId: invite.inviteeId,
          inviteeName: invite.inviteeName,
          inviterId: invite.inviterId,
          inviterName: invite.inviterName,
          inviterNickname: invite.inviterNickname || invite.inviterName,
          status: effectiveStatus,
          createdAt: invite.createdAt,
        };
      }),
    });
    response.headers.set(
      "Cache-Control",
      "private, no-cache, no-store, must-revalidate"
    );
    return response;
}

export const GET = withApiSecurity(getTeamInvitesHandler, {
  rateLimiter: "api",
  requireAuth: true,
});
