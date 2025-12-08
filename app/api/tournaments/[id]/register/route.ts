import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { SECURITY_CONFIG, hasAdminRole } from "@/lib/security-config";
import { canRegisterTeamsForTournament } from "@/lib/tournament-permissions";
import { findTeamAcrossCollections } from "@/lib/team-collections";
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity, validateBody } from "@/lib/api-wrapper";
import { revalidatePath } from "next/cache";

async function postRegisterHandler(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json(
      { error: "You must be logged in to register a team" },
      { status: 401 }
    );
  }

  const id = sanitizeString(params.id, 50);
  if (!ObjectId.isValid(id)) {
    return NextResponse.json(
      { error: "Invalid tournament ID" },
      { status: 400 }
    );
  }

  const data = await request.json();
  const validation = validateBody(data, {
    teamId: { type: "string", required: true, maxLength: 50 },
  });

  if (!validation.valid) {
    return NextResponse.json(
      { error: validation.errors?.join(", ") || "Invalid input" },
      { status: 400 }
    );
  }

  const validationData = validation.data! as { teamId: string };
  const { teamId } = validationData;
  const sanitizedTeamId = sanitizeString(teamId, 50);

  if (!ObjectId.isValid(sanitizedTeamId)) {
    return NextResponse.json({ error: "Invalid team ID" }, { status: 400 });
  }

    const client = await clientPromise;
    const db = client.db();

    const tournament = await db.collection("Tournaments").findOne({
      _id: new ObjectId(id),
    });

    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }

    // Check if tournament registration is open
    if (tournament.status !== "upcoming") {
      return NextResponse.json(
        { error: "Registration is closed for this tournament" },
        { status: 400 }
      );
    }

    const teamResult = await findTeamAcrossCollections(db, sanitizedTeamId);
    if (!teamResult) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }
    const team = teamResult.team;

    // Check if user is authorized (captain, admin, founder, developer, or co-host)
    const isDeveloper = session.user.id === SECURITY_CONFIG.DEVELOPER_ID;
    const userRoles = session.user.roles || [];
    const isAdminOrFounder = hasAdminRole(userRoles);
    const isTeamCaptain = team.captain?.discordId === session.user.id;
    const isTournamentManager = canRegisterTeamsForTournament(
      session.user.id,
      userRoles,
      {
        coHosts: tournament.coHosts,
        createdBy: tournament.createdBy,
      }
    );
    const isAuthorized =
      isTeamCaptain ||
      isDeveloper ||
      isAdminOrFounder ||
      isTournamentManager ||
      (await isAdmin(db, session.user.id));

    if (!isAuthorized) {
      return NextResponse.json(
        {
          error:
            "You must be team captain, admin, founder, developer, or tournament co-host to register for tournaments",
        },
        { status: 403 }
      );
    }

    // IMPORTANT FIX: Make sure we have team members array
    // and it has the correct format
    if (!team.members || !Array.isArray(team.members)) {
      team.members = [];
    }

    // Get all member IDs for ELO calculation
    const memberIds = team.members.map(
      (member: TeamMember) => member.discordId
    );

    // Make sure to include the captain in the ELO calculation
    if (team.captain && team.captain.discordId) {
      if (!memberIds.includes(team.captain.discordId)) {
        memberIds.push(team.captain.discordId);
      }
    }

    // Get player data from both databases for accurate ELO
    const webPlayers = await db
      .collection("Players")
      .find({ discordId: { $in: memberIds } })
      .toArray();

    // Also get players from ShadowrunDB2
    const db2 = client.db("ShadowrunDB2");
    const db2Players = await db2
      .collection("players")
      .find({ discordId: { $in: memberIds } })
      .toArray();

    // Get tournament team size
    const tournamentTeamSize = tournament.teamSize || 4;

    // Validate that team's teamSize matches tournament's teamSize
    const teamTeamSize = team.teamSize || 4;
    if (teamTeamSize !== tournamentTeamSize) {
      return NextResponse.json(
        {
          error: `This tournament is for ${tournamentTeamSize}v${tournamentTeamSize} teams. Your team "${team.name}" is a ${teamTeamSize}v${teamTeamSize} team.`,
        },
        { status: 400 }
      );
    }

    // IMPROVED VALIDATION: Check if team has exactly the required number of members
    // Count members properly, ensuring we don't double-count the captain
    let memberCount = team.members.length;

    // If captain is not already included in members array, add them to the count
    const captainInMembersArray = team.members.some(
      (member: TeamMember) => member.discordId === team.captain?.discordId
    );
    if (team.captain && !captainInMembersArray) {
      memberCount += 1;
    }

    // Strictly enforce team size requirement - team must be FULL
    if (memberCount !== tournamentTeamSize) {
      return NextResponse.json(
        {
          error: `Your team needs exactly ${tournamentTeamSize} members to register for this tournament. Current team size: ${memberCount}`,
        },
        { status: 400 }
      );
    }

    // Build enhanced member details
    const enhancedMembers = team.members.map(
      (member: {
        discordId: any;
        discordUsername: any;
        discordNickname: any;
        discordProfilePicture: any;
        role: any;
      }) => {
        // Find player data for this member
        const player = webPlayers.find((p) => p.discordId === member.discordId);

        // Find the correct ELO for this team size
        let playerElo = 0;
        if (player && player.stats && Array.isArray(player.stats)) {
          const statForSize = player.stats.find(
            (s) => s.teamSize === tournamentTeamSize
          );
          if (statForSize && typeof statForSize.elo === "number") {
            playerElo = statForSize.elo;
          }
        }

        // For teamSize 4, prioritize DB2 data
        if (tournamentTeamSize === 4) {
          const db2Player = db2Players.find(
            (p) => p.discordId === member.discordId
          );
          if (db2Player && db2Player.rating !== undefined) {
            playerElo = db2Player.rating;
          }
        }

        return {
          discordId: member.discordId,
          discordUsername:
            player?.discordUsername || member.discordUsername || "Unknown",
          discordNickname:
            player?.discordNickname || member.discordNickname || null,
          discordProfilePicture:
            player?.discordProfilePicture ||
            member.discordProfilePicture ||
            null,
          role: member.role || "member",
          elo: playerElo,
        };
      }
    );

    // Properly handle the captain data
    const captainPlayer = webPlayers.find(
      (p) => p.discordId === team.captain?.discordId
    );

    // Find the correct ELO for captain based on team size
    let captainElo = 0;
    if (
      captainPlayer &&
      captainPlayer.stats &&
      Array.isArray(captainPlayer.stats)
    ) {
      const statForSize = captainPlayer.stats.find(
        (s) => s.teamSize === tournamentTeamSize
      );
      if (statForSize && typeof statForSize.elo === "number") {
        captainElo = statForSize.elo;
      }
    }

    const captainData = {
      discordId: team.captain?.discordId || "",
      discordUsername:
        captainPlayer?.discordUsername ||
        team.captain?.discordUsername ||
        "Unknown",
      discordNickname:
        captainPlayer?.discordNickname || team.captain?.discordNickname || null,
      discordProfilePicture:
        captainPlayer?.discordProfilePicture ||
        team.captain?.discordProfilePicture ||
        null,
      elo: captainElo,
    };

    // Calculate team ELO based on top players for the team size
    const sortedByElo = [...enhancedMembers].sort((a, b) => b.elo - a.elo);
    const topMembers = sortedByElo.slice(0, tournamentTeamSize);
    const teamElo = topMembers.reduce((sum, member) => sum + member.elo, 0);

    // Create enhanced team data with all the correct information
    const enhancedTeamData = {
      _id: team._id.toString(),
      name: team.name,
      tag: team.tag || "",
      description: team.description || "",
      teamElo,
      members: enhancedMembers,
      captain: captainData,
    };

    // Register team for tournament
    // Remove any existing registration for this team first
    await db.collection("Tournaments").updateOne(
      { _id: new ObjectId(id) },
      {
        $pull: { registeredTeams: { _id: team._id.toString() } as any },
      }
    );

    // Then add the enhanced team data
    await db.collection("Tournaments").updateOne(
      { _id: new ObjectId(id) },
      {
        $push: { registeredTeams: enhancedTeamData as any },
        $set: { updatedAt: new Date() },
      }
    );

    revalidatePath(`/tournaments/${id}`);
    revalidatePath("/tournaments");

    return NextResponse.json({
      success: true,
      message: "Team successfully registered for tournament",
      team: enhancedTeamData,
    });
}

export const POST = withApiSecurity(postRegisterHandler, {
  rateLimiter: "api",
  requireAuth: true,
  revalidatePaths: ["/tournaments"],
});

// Helper to check if user is admin
async function isAdmin(db: any, userId: string): Promise<boolean> {
  const user = await db.collection("Users").findOne({ discordId: userId });
  return user?.roles?.includes("admin") || false;
}

// Add interfaces for team members and player stats
interface TeamMember {
  discordId: string;
  discordUsername?: string;
  discordNickname?: string | null;
  discordProfilePicture?: string | null;
  role?: string;
  joinedAt?: string;
}

interface PlayerStat {
  teamSize: number;
  elo: number;
  wins?: number;
  losses?: number;
}

interface Player {
  _id: string | ObjectId;
  discordId: string;
  discordUsername?: string;
  stats?: PlayerStat[];
  [key: string]: any;
}
