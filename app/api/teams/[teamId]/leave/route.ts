import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import type { UpdateFilter } from "mongodb";
import { recalculateTeamElo } from "@/lib/team-elo-calculator";
import { findTeamAcrossCollections } from "@/lib/team-collections";
import { notifyTeamMemberChange, notifyScrimmageCancellation, getGuildId } from "@/lib/discord-bot-api";
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity } from "@/lib/api-wrapper";
import { revalidatePath } from "next/cache";

async function postLeaveHandler(
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

  const userId = session.user.id;
  const { db } = await connectToDatabase();

    // Check that the team exists - search across all collections
    const teamResult = await findTeamAcrossCollections(db, teamId);
    if (!teamResult) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }
    const team = teamResult.team;
    const collectionName = teamResult.collectionName;

    // Check that the user is a member of the team and get their info
    const memberLeaving = team.members.find((m: any) => m.discordId === userId);
    if (!memberLeaving) {
      return NextResponse.json(
        { error: "You are not a member of this team" },
        { status: 400 }
      );
    }

    // Check that the user is not the captain (captains should transfer captaincy instead)
    const isCaptain = team.captain?.discordId === userId;
    if (isCaptain) {
      return NextResponse.json(
        { error: "Team captains must transfer captain role before leaving" },
        { status: 400 }
      );
    }

    // Remove the user from the team using a simple type assertion
    await db.collection(collectionName).updateOne({ _id: new ObjectId(teamId) }, {
      $pull: { members: { discordId: userId } },
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
              cancellationReason: `Team "${team.name}" no longer has enough members (${memberCount}/${teamSize})`,
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
              message: `The scrimmage with "${team.name}" has been cancelled because the team no longer has enough members.`,
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
              const cancellationReason = `Team "${team.name}" no longer has enough members (${memberCount}/${teamSize})`;
              await notifyScrimmageCancellation(
                scrimmage.scrimmageId || scrimmage._id.toString(),
                teamId,
                team.name,
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

    // Create a notification for the team captain
    await db.collection("Notifications").insertOne({
      userId: team.captain.discordId,
      type: "team_member_left",
      title: "Team Member Left",
      message: `${session.user.name || "A team member"} has left your team "${
        team.name
      }"`,
      read: false,
      createdAt: new Date(),
      metadata: {
        teamId: teamId,
        teamName: team.name,
        memberName: session.user.name,
        memberId: userId,
        userName: session.user.name || (memberLeaving as any).discordNickname,
        userAvatar: (memberLeaving as any).discordProfilePicture || session.user.image || undefined,
      },
    });

    // Send Discord DM notification via bot API
    try {
      const teamSize = team.teamSize || 4;
      await notifyTeamMemberChange(
        teamId,
        "left",
        {
          discordId: userId,
          discordUsername: session.user.name || "Unknown",
          discordNickname: session.user.nickname || memberLeaving.discordNickname || session.user.name || "Unknown",
        },
        teamSize
      ).catch(() => {
        // Don't fail the request if notification fails
      });
    } catch (error) {
      // Don't fail the request if notification fails
    }

    await recalculateTeamElo(teamId);

    revalidatePath(`/teams/${teamId}`);
    revalidatePath("/teams");

    return NextResponse.json({ success: true });
}

export const POST = withApiSecurity(postLeaveHandler, {
  rateLimiter: "api",
  requireAuth: true,
  revalidatePaths: ["/teams"],
});
