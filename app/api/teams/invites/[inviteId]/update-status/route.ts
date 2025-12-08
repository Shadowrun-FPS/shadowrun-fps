import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { recalculateTeamElo } from "@/lib/team-elo-calculator";
import { findTeamAcrossCollections } from "@/lib/team-collections";
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity, validateBody } from "@/lib/api-wrapper";
import { revalidatePath } from "next/cache";

/**
 * API endpoint for Discord bot to update invite status
 * This is called when a user accepts/rejects an invite via Discord buttons
 * 
 * POST /api/teams/invites/[inviteId]/update-status
 * Body: { status: "accepted" | "rejected", inviteeId: string }
 */
async function postUpdateInviteStatusHandler(
  req: NextRequest,
  { params }: { params: Promise<{ inviteId: string }> | { inviteId: string } }
) {
  const { db } = await connectToDatabase();
  const resolvedParams = await Promise.resolve(params);
  const inviteId = sanitizeString(resolvedParams.inviteId, 50);

  if (!ObjectId.isValid(inviteId)) {
    return NextResponse.json(
      { error: "Invalid invite ID" },
      { status: 400 }
    );
  }

  const body = await req.json();
  const validation = validateBody(body, {
    status: {
      type: "string",
      required: true,
      pattern: /^(accepted|rejected)$/,
    },
    inviteeId: { type: "string", required: true, maxLength: 50 },
  });

  if (!validation.valid) {
    return NextResponse.json(
      { error: validation.errors?.join(", ") || "Invalid input" },
      { status: 400 }
    );
  }

  const { status, inviteeId } = validation.data! as {
    status: string;
    inviteeId: string;
  };

  const sanitizedInviteeId = sanitizeString(inviteeId, 50);

    const invite = await db.collection("TeamInvites").findOne({
      _id: new ObjectId(inviteId),
      inviteeId: sanitizedInviteeId,
      status: "pending",
    });

    if (!invite) {
      return NextResponse.json(
        { error: "Invite not found or already processed" },
        { status: 404 }
      );
    }

    await db.collection("TeamInvites").updateOne(
      { _id: new ObjectId(inviteId) },
      { 
        $set: { 
          status: sanitizeString(status, 20),
          updatedAt: new Date(),
        } 
      }
    );

    if (status === "accepted") {
      await db.collection("TeamInvites").updateMany(
        {
          inviteeId: sanitizedInviteeId,
          status: "pending",
          _id: { $ne: new ObjectId(inviteId) },
        },
        { $set: { status: "cancelled" } }
      );

      const player = await db.collection("Players").findOne({
        discordId: sanitizedInviteeId,
      });

      const playerName = sanitizeString(
        player?.discordNickname || player?.discordUsername || "Unknown",
        100
      );

      await db.collection("Notifications").insertOne({
        userId: sanitizeString(invite.inviterId, 50),
        type: "invite_accepted",
        title: "Team Invite Accepted",
        message: sanitizeString(
          `${playerName} has accepted your invitation to join team "${invite.teamName}"`,
          500
        ),
        read: false,
        createdAt: new Date(),
        metadata: {
          teamId: sanitizeString(invite.teamId.toString(), 50),
          teamName: sanitizeString(invite.teamName || "", 100),
          inviteeId: sanitizedInviteeId,
          inviteeName: playerName,
        },
      });

      try {
        await recalculateTeamElo(invite.teamId.toString());
      } catch (eloError) {
        safeLog.error("Error recalculating team ELO after invite acceptance:", eloError);
      }
    } else if (status === "rejected") {
      const player = await db.collection("Players").findOne({
        discordId: sanitizedInviteeId,
      });

      const playerName = sanitizeString(
        player?.discordNickname || player?.discordUsername || "Unknown",
        100
      );

      await db.collection("Notifications").insertOne({
        userId: sanitizeString(invite.inviterId, 50),
        type: "invite_rejected",
        title: "Team Invite Rejected",
        message: sanitizeString(
          `${playerName} has rejected your invitation to join team "${invite.teamName}"`,
          500
        ),
        read: false,
        createdAt: new Date(),
        metadata: {
          teamId: sanitizeString(invite.teamId.toString(), 50),
          teamName: sanitizeString(invite.teamName || "", 100),
          inviteeId: sanitizedInviteeId,
          inviteeName: playerName,
        },
      });
    }

    revalidatePath("/teams");
    revalidatePath(`/teams/${invite.teamId.toString()}`);

    return NextResponse.json({
      success: true,
      message: `Invite status updated to ${status}`,
    });
}

export const POST = withApiSecurity(postUpdateInviteStatusHandler, {
  rateLimiter: "api",
  requireAuth: false,
  revalidatePaths: ["/teams"],
});

