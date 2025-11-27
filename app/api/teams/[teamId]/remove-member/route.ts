import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { recalculateTeamElo } from "@/lib/team-elo-calculator";
import { findTeamAcrossCollections, getTeamCollectionName } from "@/lib/team-collections";
import { notifyTeamMemberChange, notifyScrimmageCancellation, getGuildId } from "@/lib/discord-bot-api";

export async function POST(
  req: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { memberId } = await req.json();
    if (!memberId) {
      return NextResponse.json(
        { error: "Member ID is required" },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const teamId = params.teamId;

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

    // Check if the member exists in the team and get their info
    const memberToRemove = team.members.find(
      (m: any) => m.discordId === memberId
    );
    if (!memberToRemove) {
      return NextResponse.json(
        { error: "Member not found in the team" },
        { status: 404 }
      );
    }

    // Prevent removing yourself as captain through this endpoint
    if (memberId === session.user.id) {
      return NextResponse.json(
        {
          error:
            "Captains cannot remove themselves. Use transfer captain instead.",
        },
        { status: 400 }
      );
    }

    // Remove the member from the team
    await db.collection(collectionName).updateOne({ _id: new ObjectId(teamId) }, {
      $pull: { members: { discordId: memberId } },
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

    // Create notification for the removed member
    await db.collection("Notifications").insertOne({
      userId: memberId,
      type: "team_removed",
      title: "Removed from Team",
      message: `You have been removed from the team "${team.name}" by the team captain.`,
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
          discordId: memberId,
          discordUsername: memberToRemove.discordUsername || "Unknown",
          discordNickname: memberToRemove.discordNickname || memberToRemove.discordUsername || "Unknown",
        },
        teamSize,
        captainName
      ).catch(() => {
        // Don't fail the request if notification fails
      });
    } catch (error) {
      // Don't fail the request if notification fails
    }

    // UPDATED: Use the recalculateTeamElo function to update the team's ELO
    await recalculateTeamElo(teamId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing team member:", error);
    return NextResponse.json(
      { error: "Failed to remove team member" },
      { status: 500 }
    );
  }
}
