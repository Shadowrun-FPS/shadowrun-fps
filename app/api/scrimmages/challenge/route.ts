import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { v4 as uuidv4 } from "uuid";
import { getAllTeamCollectionNames, findTeamAcrossCollections } from "@/lib/team-collections";
import { notifyScrimmageChallenge, getGuildId } from "@/lib/discord-bot-api";
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity, validateBody } from "@/lib/api-wrapper";
import { revalidatePath } from "next/cache";

async function postChallengeHandler(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { db } = await connectToDatabase();
  const data = await request.json();

  const validation = validateBody(data, {
    challengedTeamId: { type: "string", required: true, maxLength: 50 },
    proposedDate: { type: "string", required: true },
    selectedMaps: { type: "array", required: true },
    message: { type: "string", required: false, maxLength: 500 },
  });

  if (!validation.valid) {
    return NextResponse.json(
      { error: validation.errors?.join(", ") || "Invalid input" },
      { status: 400 }
    );
  }

  const { challengedTeamId, proposedDate, selectedMaps, message } = validation.data! as {
    challengedTeamId: string;
    proposedDate: string;
    selectedMaps: any[];
    message?: string;
  };

  if (!Array.isArray(selectedMaps) || selectedMaps.length === 0) {
    return NextResponse.json(
      { error: "selectedMaps must be a non-empty array" },
      { status: 400 }
    );
  }

  const sanitizedChallengedTeamId = sanitizeString(challengedTeamId, 50);

    // Get the user's team - search across all collections
    const allCollections = getAllTeamCollectionNames();
    let userTeam = null;
    for (const collectionName of allCollections) {
      userTeam = await db.collection(collectionName).findOne({
        "members.discordId": session.user.id,
      });
      if (userTeam) break;
    }

    if (!userTeam) {
      return NextResponse.json(
        { error: "You must be in a team to challenge another team" },
        { status: 400 }
      );
    }

    const challengedTeamResult = await findTeamAcrossCollections(db, sanitizedChallengedTeamId);
    if (!challengedTeamResult) {
      return NextResponse.json(
        { error: "Challenged team not found" },
        { status: 404 }
      );
    }
    const challengedTeam = challengedTeamResult.team;

    // Validate team sizes match
    const userTeamSize = userTeam.teamSize || 4;
    const challengedTeamSize = challengedTeam.teamSize || 4;
    
    if (userTeamSize !== challengedTeamSize) {
      return NextResponse.json(
        { 
          error: `Team sizes must match. Your team is ${userTeamSize}v${userTeamSize}, but ${challengedTeam.name} is ${challengedTeamSize}v${challengedTeamSize}.` 
        },
        { status: 400 }
      );
    }

    // Validate both teams are full
    const userTeamMemberCount = userTeam.members?.length || 0;
    const challengedTeamMemberCount = challengedTeam.members?.length || 0;
    
    if (userTeamMemberCount < userTeamSize) {
      return NextResponse.json(
        { 
          error: `Your team needs ${userTeamSize} members to challenge others (currently has ${userTeamMemberCount}).` 
        },
        { status: 400 }
      );
    }
    
    if (challengedTeamMemberCount < challengedTeamSize) {
      return NextResponse.json(
        { 
          error: `${challengedTeam.name} needs ${challengedTeamSize} members to be challenged (currently has ${challengedTeamMemberCount}).` 
        },
        { status: 400 }
      );
    }

    const mapsWithGameMode = selectedMaps.map((map: any) => ({
      ...map,
      name: sanitizeString(map.name || "", 100),
      gameMode: sanitizeString(map.gameMode || "Attrition", 50),
    }));

    // Create the scrimmage
    const scrimmage = {
      scrimmageId: uuidv4(),
      challengerTeamId: userTeam._id.toString(),
      challengedTeamId: sanitizedChallengedTeamId,
      teamSize: userTeamSize, // Store the team size for the scrimmage
      challengerTeam: {
        _id: userTeam._id,
        name: userTeam.name,
        tag: userTeam.tag,
        logo: userTeam.logo,
        captain: userTeam.captain,
        members: userTeam.members.map(
          (member: {
            discordId: any;
            discordUsername: any;
            discordNickname: any;
            discordProfilePicture: any;
            role: any;
          }) => ({
            ...member,
            discordId: member.discordId,
            discordUsername: member.discordUsername,
            discordNickname: member.discordNickname,
            discordProfilePicture: member.discordProfilePicture,
            role: member.role,
          })
        ),
      },
      challengedTeam: {
        _id: challengedTeam._id,
        name: challengedTeam.name,
        tag: challengedTeam.tag,
        logo: challengedTeam.logo,
        captain: challengedTeam.captain,
        members: challengedTeam.members.map(
          (member: {
            discordId: any;
            discordUsername: any;
            discordNickname: any;
            discordProfilePicture: any;
            role: any;
          }) => ({
            ...member,
            discordId: member.discordId,
            discordUsername: member.discordUsername,
            discordNickname: member.discordNickname,
            discordProfilePicture: member.discordProfilePicture,
            role: member.role,
          })
        ),
      },
      proposedDate: new Date(proposedDate),
      selectedMaps: mapsWithGameMode,
      message: message ? sanitizeString(message, 500) : "",
      status: "pending",
      createdAt: new Date(),
      createdBy: session.user.id,
    };

    const result = await db.collection("Scrimmages").insertOne(scrimmage);

    // Create a notification for the challenged team captain
    if (challengedTeam.captain?.discordId) {
      await db.collection("Notifications").insertOne({
        userId: challengedTeam.captain.discordId,
        type: "scrimmage_challenge",
        title: "New Scrimmage Challenge",
        message: `${sanitizeString(userTeam.name, 100)} has challenged your team to a scrimmage.`,
        scrimmageId: scrimmage.scrimmageId,
        createdAt: new Date(),
        read: false,
      });
    }

    // Send Discord DM notification via bot API (primary method)
    // Change streams will act as fallback if API fails (with duplicate prevention)
    if (challengedTeam.captain?.discordId) {
      try {
        const guildId = getGuildId();
        await notifyScrimmageChallenge(
          scrimmage.scrimmageId,
          userTeam._id.toString(),
          userTeam.name,
          challengedTeam._id.toString(),
          challengedTeam.captain.discordId,
          scrimmage.proposedDate,
          scrimmage.selectedMaps,
          scrimmage.message,
          guildId
        );
      } catch (error) {
        // Don't throw - change stream will catch it as fallback with duplicate prevention
      }
    }

    revalidatePath("/scrimmages");
    revalidatePath("/tournaments/scrimmages");

    return NextResponse.json({
      success: true,
      scrimmageId: scrimmage.scrimmageId,
    });
}

export const POST = withApiSecurity(postChallengeHandler, {
  rateLimiter: "api",
  requireAuth: true,
  revalidatePaths: ["/scrimmages", "/tournaments/scrimmages"],
});
