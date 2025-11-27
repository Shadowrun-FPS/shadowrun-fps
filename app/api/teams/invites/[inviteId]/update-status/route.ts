import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { recalculateTeamElo } from "@/lib/team-elo-calculator";
import { findTeamAcrossCollections } from "@/lib/team-collections";

/**
 * API endpoint for Discord bot to update invite status
 * This is called when a user accepts/rejects an invite via Discord buttons
 * 
 * POST /api/teams/invites/[inviteId]/update-status
 * Body: { status: "accepted" | "rejected", inviteeId: string }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ inviteId: string }> | { inviteId: string } }
) {
  try {
    const { db } = await connectToDatabase();
    const resolvedParams = await Promise.resolve(params);
    const { inviteId } = resolvedParams;
    
    const { status, inviteeId } = await req.json();

    if (!["accepted", "rejected"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be 'accepted' or 'rejected'" },
        { status: 400 }
      );
    }

    if (!inviteeId) {
      return NextResponse.json(
        { error: "inviteeId is required" },
        { status: 400 }
      );
    }

    // Find the invite
    const invite = await db.collection("TeamInvites").findOne({
      _id: new ObjectId(inviteId),
      inviteeId: inviteeId,
      status: "pending", // Only update if still pending
    });

    if (!invite) {
      return NextResponse.json(
        { error: "Invite not found or already processed" },
        { status: 404 }
      );
    }

    // Update the invite status
    await db.collection("TeamInvites").updateOne(
      { _id: new ObjectId(inviteId) },
      { 
        $set: { 
          status: status,
          updatedAt: new Date(),
        } 
      }
    );

    // If accepted, also cancel all other pending invites for this user
    if (status === "accepted") {
      await db.collection("TeamInvites").updateMany(
        {
          inviteeId: inviteeId,
          status: "pending",
          _id: { $ne: new ObjectId(inviteId) },
        },
        { $set: { status: "cancelled" } }
      );

      // Get player info for notification
      const player = await db.collection("Players").findOne({
        discordId: inviteeId,
      });

      const playerName = player?.discordNickname || player?.discordUsername || "Unknown";

      // Create notification for team captain
      await db.collection("Notifications").insertOne({
        userId: invite.inviterId,
        type: "invite_accepted",
        title: "Team Invite Accepted",
        message: `${playerName} has accepted your invitation to join team "${invite.teamName}"`,
        read: false,
        createdAt: new Date(),
        metadata: {
          teamId: invite.teamId.toString(),
          teamName: invite.teamName,
          inviteeId: inviteeId,
          inviteeName: playerName,
        },
      });

      // Recalculate team ELO if member was added (bot should have already added them)
      try {
        await recalculateTeamElo(invite.teamId.toString());
      } catch (eloError) {
        console.error("Error recalculating team ELO after invite acceptance:", eloError);
        // Don't fail the request
      }
    } else if (status === "rejected") {
      // Create notification for team captain
      const player = await db.collection("Players").findOne({
        discordId: inviteeId,
      });

      const playerName = player?.discordNickname || player?.discordUsername || "Unknown";

      await db.collection("Notifications").insertOne({
        userId: invite.inviterId,
        type: "invite_rejected",
        title: "Team Invite Rejected",
        message: `${playerName} has rejected your invitation to join team "${invite.teamName}"`,
        read: false,
        createdAt: new Date(),
        metadata: {
          teamId: invite.teamId.toString(),
          teamName: invite.teamName,
          inviteeId: inviteeId,
          inviteeName: playerName,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Invite status updated to ${status}`,
    });
  } catch (error) {
    console.error("Error updating invite status:", error);
    return NextResponse.json(
      { error: "Failed to update invite status" },
      { status: 500 }
    );
  }
}

