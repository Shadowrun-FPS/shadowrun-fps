import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { SECURITY_CONFIG } from "@/lib/security-config";
import { safeLog, rateLimiters, getClientIdentifier, sanitizeString } from "@/lib/security";
import { revalidatePath } from "next/cache";

// POST endpoint to fill a tournament with random teams (testing only)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Rate limiting
    const session = await getServerSession(authOptions);
    const identifier = getClientIdentifier(request, session?.user?.id);
    if (!rateLimiters.admin.isAllowed(identifier)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    safeLog.log("Fill route hit with ID:", params.id);

    // Check authentication and admin permission
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be logged in to perform this action" },
        { status: 401 }
      );
    }

    // Check if user is admin
    const client = await clientPromise;
    const db = client.db();

    const user = await db.collection("Users").findOne({
      discordId: session.user.id,
    });

    const { id } = params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid tournament ID" },
        { status: 400 }
      );
    }

    // Get tournament
    const tournament = await db.collection("Tournaments").findOne({
      _id: new ObjectId(id),
    });

    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }

    // Update admin check to include your specific ID for testing
    const isAdmin =
      user?.roles?.includes("admin") ||
      tournament.createdBy?.discordId === session.user.id ||
      session?.user?.id === SECURITY_CONFIG.DEVELOPER_ID ||
      false;

    if (!isAdmin) {
      return NextResponse.json(
        { error: "You must be an administrator to perform this action" },
        { status: 403 }
      );
    }

    // Get random teams
    const maxTeams = tournament.maxTeams || 8;
    const teamSize = tournament.teamSize || 4;

    // Get all teams from the appropriate collection based on tournament team size
    const { getTeamCollectionName, getAllTeamCollectionNames } = await import("@/lib/team-collections");
    const collectionName = getTeamCollectionName(teamSize);
    
    // Get teams from the specific collection for this team size
    const allTeams = await db.collection(collectionName).find({}).toArray();

    // Filter teams to only include those with enough members for the tournament
    const teamsWithEnoughMembers = allTeams.filter((team) => {
      // Only look at the members array length
      return Array.isArray(team.members) && team.members.length >= teamSize;
    });

    // Take the maximum number of teams needed
    const teams = teamsWithEnoughMembers.slice(0, maxTeams);

    safeLog.log(
      `Found ${teamsWithEnoughMembers.length} teams with ${teamSize} or more members, using ${teams.length}`
    );

    if (teams.length === 0) {
      return NextResponse.json(
        { error: "No teams available with enough members" },
        { status: 400 }
      );
    }

    // Collect all player IDs from teams
    const playerIds = teams.flatMap((team) => {
      const memberIds = team.members.map(
        (m: { discordId: any }) => m.discordId
      );
      if (team.captain && team.captain.discordId) {
        memberIds.push(team.captain.discordId);
      }
      return memberIds;
    });

    // Get player data for accurate ELO values
    const players = await db
      .collection("Players")
      .find({ discordId: { $in: playerIds } })
      .toArray();

    // Process teams with enhanced data
    const enhancedTeams = teams.map((team) => {
      // Team size from tournament
      const teamSize = tournament.teamSize || 4;

      // Process team members
      const enhancedMembers = team.members.map(
        (member: {
          discordId: any;
          discordUsername: any;
          discordNickname: any;
          discordProfilePicture: any;
          role: any;
        }) => {
          // Find player data for this member
          const player = players.find((p) => p.discordId === member.discordId);

          // Get the correct ELO for this team size
          let playerElo = 0;
          if (player && player.stats && Array.isArray(player.stats)) {
            const statForSize = player.stats.find(
              (s) => s.teamSize === teamSize
            );
            if (statForSize && typeof statForSize.elo === "number") {
              playerElo = statForSize.elo;
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

      // Handle captain data
      const captain = team.captain;
      const captainPlayer = players.find(
        (p) => p.discordId === captain.discordId
      );

      // Get captain's ELO for the right team size
      let captainElo = 0;
      if (
        captainPlayer &&
        captainPlayer.stats &&
        Array.isArray(captainPlayer.stats)
      ) {
        const statForSize = captainPlayer.stats.find(
          (s) => s.teamSize === teamSize
        );
        if (statForSize && typeof statForSize.elo === "number") {
          captainElo = statForSize.elo;
        }
      }

      const captainData = {
        discordId: captain.discordId || "",
        discordUsername:
          captainPlayer?.discordUsername ||
          captain.discordUsername ||
          "Unknown",
        discordNickname:
          captainPlayer?.discordNickname || captain.discordNickname || null,
        discordProfilePicture:
          captainPlayer?.discordProfilePicture ||
          captain.discordProfilePicture ||
          null,
        elo: captainElo,
      };

      // Calculate team ELO from top players
      const sortedByElo = [...enhancedMembers].sort((a, b) => b.elo - a.elo);
      const topMembers = sortedByElo.slice(0, teamSize);
      const teamElo = topMembers.reduce((sum, member) => sum + member.elo, 0);

      // Return enhanced team data
      return {
        _id: team._id.toString(),
        name: team.name,
        tag: team.tag || "",
        description: team.description || "",
        teamElo,
        members: enhancedMembers,
        captain: captainData,
      };
    });

    // Then update your code that inserts these into the tournament
    await db.collection("Tournaments").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          teams: teams.map((team) => team._id),
          registeredTeams: enhancedTeams,
          updatedAt: new Date(),
        },
      }
    );

    // Revalidate tournament pages
    revalidatePath(`/tournaments/${id}`);
    revalidatePath("/tournaments");

    return NextResponse.json({
      success: true,
      message: `Tournament filled with ${teams.length} random teams`,
    });
  } catch (error) {
    safeLog.error("Error filling tournament:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
