import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { recalculateTeamElo } from "@/lib/team-elo-calculator";
import { findTeamAcrossCollections, getTeamCollectionName } from "@/lib/team-collections";
import { notifyTeamInvite, getGuildId } from "@/lib/discord-bot-api";

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

    // Verify user is team captain - search across all collections
    const teamResult = await findTeamAcrossCollections(db, teamId);
    if (!teamResult) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }
    const team = teamResult.team;

    // Check if the current user is the team captain
    if (team.captain.discordId !== session.user.id) {
      return NextResponse.json(
        { error: "Only team captain can send invites" },
        { status: 403 }
      );
    }

    const { playerId, playerName } = await req.json();

    // Get team size (default to 4 if not specified)
    const teamSize = team.teamSize || 4;
    
    // Simply count the members array length
    const memberCount = team.members.length;


    // Check if the team has reached maximum size
    // Without counting pending invites
    if (memberCount >= teamSize) {
      return NextResponse.json(
        { error: `Team has reached maximum size (${teamSize} players)` },
        { status: 400 }
      );
    }

    // Check if player is already in this team
    const isMember = team.members.some(
      (member: any) => member.discordId === playerId
    );
    if (isMember) {
      return NextResponse.json(
        { error: "Player is already a team member" },
        { status: 400 }
      );
    }

    // Check if player is already in another team of the SAME size
    const collectionName = getTeamCollectionName(teamSize);
    const existingTeamOfSameSize = await db.collection(collectionName).findOne({
      "members.discordId": playerId,
      teamSize: teamSize,
      _id: { $ne: new ObjectId(teamId) }, // Exclude the current team
    });

    if (existingTeamOfSameSize) {
      return NextResponse.json(
        { 
          error: `Player is already in a ${teamSize}-person team (${existingTeamOfSameSize.name}). Players can only be in one team per team size.` 
        },
        { status: 400 }
      );
    }

    // Check if a PENDING invite already exists (not just any status)
    const existingInvite = await db.collection("TeamInvites").findOne({
      teamId: new ObjectId(teamId),
      inviteeId: playerId,
      status: "pending", // Only check for pending invites
    });

    if (existingInvite) {
      return NextResponse.json(
        { error: "Invite already sent" },
        { status: 400 }
      );
    }

    // Allow re-inviting if previous invite was cancelled, rejected or expired

    // Get inviter's nickname from Players collection
    const inviterPlayer = await db.collection("Players").findOne({
      discordId: session.user.id,
    });
    const inviterNickname = inviterPlayer?.discordNickname || session.user.nickname || session.user.name;

    // Create the invitation document
    const invitation = {
      teamId: new ObjectId(teamId),
      teamName: team.name,
      inviterId: session.user.id,
      inviterName: session.user.name,
      inviterNickname: inviterNickname,
      inviteeId: playerId,
      inviteeName: playerName,
      status: "pending",
      createdAt: new Date(),
    };

    // Insert the invitation and capture the result with the generated _id
    const result = await db.collection("TeamInvites").insertOne(invitation);

    // Create a notification for the invitee (for web app notifications page)
    await db.collection("Notifications").insertOne({
      userId: playerId,
      type: "team_invite",
      title: "Team Invitation",
      message: `You have been invited to join ${team.name}`,
      read: false,
      createdAt: new Date(),
      inviterName: session.user.name,
      metadata: {
        teamId: teamId,
        teamName: team.name,
        teamTag: team.tag,
        inviteId: result.insertedId.toString(),
      },
    });

    // Send Discord DM notification via bot API (primary method)
    // Change streams will act as fallback if API fails (with duplicate prevention)
    try {
      const guildId = getGuildId();
      const currentMembers = team.members.length;
      
      await notifyTeamInvite(
        teamId,
        playerId,
        playerName,
        session.user.id,
        inviterNickname || session.user.name || "Unknown",
        team.name,
        result.insertedId.toString(), // REQUIRED: Pass the inviteId so bot can use it in buttons
        teamSize,
        team.tag,
        team.description, // Optional: team description
        currentMembers, // Current member count
        guildId // Helps fetch inviter's guild nickname
      );
    } catch (error) {
      // Don't throw - change stream will catch it as fallback with duplicate prevention
    }

    return NextResponse.json({
      success: true,
      message: `Invite sent to ${playerName}`,
    });
  } catch (error) {
    console.error("Failed to create team invite:", error);
    return NextResponse.json(
      { error: "Failed to create team invite" },
      { status: 500 }
    );
  }
}
