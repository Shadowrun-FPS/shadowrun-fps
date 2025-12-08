import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { recalculateTeamElo } from "@/lib/team-elo-calculator";
import {
  findTeamAcrossCollections,
  getTeamCollectionName,
} from "@/lib/team-collections";
import { notifyTeamInvite, getGuildId } from "@/lib/discord-bot-api";
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity, validateBody } from "@/lib/api-wrapper";
import { revalidatePath } from "next/cache";

async function postInviteHandler(
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
    playerId: { type: "string", required: true, maxLength: 50 },
    playerName: { type: "string", required: true, maxLength: 100 },
  });

  if (!validation.valid) {
    return NextResponse.json(
      { error: validation.errors?.join(", ") || "Invalid input" },
      { status: 400 }
    );
  }

  const { playerId, playerName } = validation.data! as {
    playerId: string;
    playerName: string;
  };
  const sanitizedPlayerId = sanitizeString(playerId, 50);
  const sanitizedPlayerName = sanitizeString(playerName, 100);

  const { db } = await connectToDatabase();

  const teamResult = await findTeamAcrossCollections(db, teamId);
  if (!teamResult) {
    return NextResponse.json({ error: "Team not found" }, { status: 404 });
  }
  const team = teamResult.team;

  if (team.captain.discordId !== session.user.id) {
    return NextResponse.json(
      { error: "Only team captain can send invites" },
      { status: 403 }
    );
  }

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

  const isMember = team.members.some(
    (member: any) => member.discordId === sanitizedPlayerId
  );
  if (isMember) {
    return NextResponse.json(
      { error: "Player is already a team member" },
      { status: 400 }
    );
  }

  const collectionName = getTeamCollectionName(teamSize);
  const existingTeamOfSameSize = await db.collection(collectionName).findOne({
    "members.discordId": sanitizedPlayerId,
    teamSize: teamSize,
    _id: { $ne: new ObjectId(teamId) },
  });

  if (existingTeamOfSameSize) {
    return NextResponse.json(
      {
        error: `Player is already in a ${teamSize}-person team (${existingTeamOfSameSize.name}). Players can only be in one team per team size.`,
      },
      { status: 400 }
    );
  }

  const existingInvite = await db.collection("TeamInvites").findOne({
    teamId: new ObjectId(teamId),
    inviteeId: sanitizedPlayerId,
    status: "pending",
  });

  if (existingInvite) {
    return NextResponse.json({ error: "Invite already sent" }, { status: 400 });
  }

  // Allow re-inviting if previous invite was cancelled, rejected or expired

  // Get inviter's nickname from Players collection
  const inviterPlayer = await db.collection("Players").findOne({
    discordId: session.user.id,
  });
  const inviterNickname =
    inviterPlayer?.discordNickname ||
    session.user.nickname ||
    session.user.name;

  const invitation = {
    teamId: new ObjectId(teamId),
    teamName: sanitizeString(team.name, 100),
    inviterId: session.user.id,
    inviterName: sanitizeString(session.user.name || "", 100),
    inviterNickname: sanitizeString(inviterNickname, 100),
    inviteeId: sanitizedPlayerId,
    inviteeName: sanitizedPlayerName,
    status: "pending",
    createdAt: new Date(),
  };

  // Insert the invitation and capture the result with the generated _id
  const result = await db.collection("TeamInvites").insertOne(invitation);

  await db.collection("Notifications").insertOne({
    userId: sanitizedPlayerId,
    type: "team_invite",
    title: "Team Invitation",
    message: `You have been invited to join ${sanitizeString(team.name, 100)}`,
    read: false,
    createdAt: new Date(),
    inviterName: sanitizeString(session.user.name || "", 100),
    metadata: {
      teamId: teamId,
      teamName: sanitizeString(team.name, 100),
      teamTag: sanitizeString(team.tag || "", 10),
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
      sanitizedPlayerId,
      sanitizedPlayerName,
      session.user.id,
      sanitizeString(inviterNickname || session.user.name || "Unknown", 100),
      sanitizeString(team.name, 100),
      result.insertedId.toString(),
      teamSize,
      sanitizeString(team.tag || "", 10),
      sanitizeString(team.description || "", 500),
      currentMembers,
      guildId
    );
  } catch (error) {
    // Don't throw - change stream will catch it as fallback with duplicate prevention
  }

  revalidatePath(`/teams/${teamId}`);
  revalidatePath("/teams");

  return NextResponse.json({
    success: true,
    message: `Invite sent to ${sanitizedPlayerName}`,
  });
}

export const POST = withApiSecurity(postInviteHandler, {
  rateLimiter: "api",
  requireAuth: true,
  revalidatePaths: ["/teams"],
});
