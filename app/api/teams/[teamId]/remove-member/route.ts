import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { recalculateTeamElo } from "@/lib/team-elo-calculator";
import { findTeamAcrossCollections, getTeamCollectionName } from "@/lib/team-collections";
import { notifyTeamMemberChange, notifyScrimmageCancellation, getGuildId } from "@/lib/discord-bot-api";
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity, validateBody } from "@/lib/api-wrapper";
import { revalidatePath } from "next/cache";

async function postRemoveMemberHandler(
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

  const body = await req.json();
  const validation = validateBody(body, {
    memberId: { type: "string", required: true, maxLength: 50 },
  });

  if (!validation.valid) {
    return NextResponse.json(
      { error: validation.errors?.join(", ") || "Invalid input" },
      { status: 400 }
    );
  }

  const { memberId } = validation.data! as { memberId: string };
  const sanitizedMemberId = sanitizeString(memberId, 50);

  const { db } = await connectToDatabase();

    // Verify the user is the team captain - search across all collections
    const teamResult = await findTeamAcrossCollections(db, teamId);
    if (!teamResult || teamResult.team.captain.discordId !== session.user.id) {
      return NextResponse.json(
        { error: "You are not the captain of this team" },
        { status: 403 }
      );
    }
    const team = teamResult.team;
    const collectionName = teamResult.collectionName;

    const memberToRemove = team.members.find(
      (m: any) => m.discordId === sanitizedMemberId
    );
    if (!memberToRemove) {
      return NextResponse.json(
        { error: "Member not found in the team" },
        { status: 404 }
      );
    }

    if (sanitizedMemberId === session.user.id) {
      return NextResponse.json(
        {
          error:
            "Captains cannot remove themselves. Use transfer captain instead.",
        },
        { status: 400 }
      );
    }

    await db.collection(collectionName).updateOne({ _id: new ObjectId(teamId) }, {
      $pull: { members: { discordId: sanitizedMemberId } },
    } as any);

    // Get updated team to check member count
    const updatedTeamResult = await findTeamAcrossCollections(db, teamId);
    const updatedTeam = updatedTeamResult?.team;
    const teamSize = updatedTeam?.teamSize || 4;
    const memberCount = updatedTeam?.members?.length || 0;

    // Check if team now has fewer members than required for pending scrimmages
    if (memberCount < teamSize) {
      const pendingScrimmages = await db.collection("Scrimmages").find({
        status: "pending",
        $or: [
          { challengerTeamId: teamId },
          { challengedTeamId: teamId },
        ],
      }).toArray();

      if (pendingScrimmages.length > 0) {
        // Cancel pending scrimmages
        await db.collection("Scrimmages").updateMany(
          {
            status: "pending",
            $or: [
              { challengerTeamId: teamId },
              { challengedTeamId: teamId },
            ],
          },
          {
            $set: {
              status: "cancelled",
              updatedAt: new Date(),
              cancellationReason: `Team "${sanitizeString(team.name, 100)}" no longer has enough members (${memberCount}/${teamSize})`,
            },
          }
        );

        // Notify the other team's captains about cancelled scrimmages
        for (const scrimmage of pendingScrimmages) {
          const otherTeamId = scrimmage.challengerTeamId === teamId 
            ? scrimmage.challengedTeamId 
            : scrimmage.challengerTeamId;
          
          const otherTeamResult = await findTeamAcrossCollections(db, otherTeamId);
          if (otherTeamResult?.team?.captain?.discordId) {
            await db.collection("Notifications").insertOne({
              userId: otherTeamResult.team.captain.discordId,
              type: "scrimmage_cancelled",
              title: "Scrimmage Cancelled",
              message: `The scrimmage with "${sanitizeString(team.name, 100)}" has been cancelled because the team no longer has enough members.`,
              read: false,
              createdAt: new Date(),
              metadata: {
                scrimmageId: scrimmage._id.toString(),
                cancelledTeamId: teamId,
                cancelledTeamName: team.name,
              },
            });

            // Send Discord DM notification via bot API (primary method)
            // Change streams will act as fallback if API fails (with duplicate prevention)
            try {
              const guildId = getGuildId();
              const cancellationReason = `Team "${sanitizeString(team.name, 100)}" no longer has enough members (${memberCount}/${teamSize})`;
              await notifyScrimmageCancellation(
                scrimmage.scrimmageId || scrimmage._id.toString(),
                teamId,
                sanitizeString(team.name, 100),
                otherTeamResult.team.captain.discordId,
                cancellationReason,
                guildId
              );
            } catch (error) {
              // Don't throw - change stream will catch it as fallback with duplicate prevention
            }
          }
        }
      }
    }

    await db.collection("Notifications").insertOne({
      userId: sanitizedMemberId,
      type: "team_removed",
      title: "Removed from Team",
      message: `You have been removed from the team "${sanitizeString(team.name, 100)}" by the team captain.`,
      read: false,
      createdAt: new Date(),
      metadata: {
        teamId,
        teamName: team.name,
      },
    });

    // Send Discord DM notification via bot API
    try {
      const teamSize = team.teamSize || 4;
      const captainName = team.captain?.discordNickname || session.user.nickname || session.user.name;
      
      await notifyTeamMemberChange(
        teamId,
        "removed",
        {
          discordId: sanitizedMemberId,
          discordUsername: sanitizeString(memberToRemove.discordUsername || "Unknown", 100),
          discordNickname: sanitizeString(memberToRemove.discordNickname || memberToRemove.discordUsername || "Unknown", 100),
        },
        teamSize,
        sanitizeString(captainName, 100)
      ).catch((err) => {
        safeLog.error("Failed to send Discord notification:", err);
      });
    } catch (error) {
      safeLog.error("Error sending Discord notification:", error);
    }

    await recalculateTeamElo(teamId);

    revalidatePath(`/teams/${teamId}`);
    revalidatePath("/teams");

    return NextResponse.json({ success: true });
}

export const POST = withApiSecurity(postRemoveMemberHandler, {
  rateLimiter: "api",
  requireAuth: true,
  revalidatePaths: ["/teams"],
});
