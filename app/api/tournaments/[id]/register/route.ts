import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// POST endpoint to register a team for a tournament
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get session and check authentication
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be logged in to register a team" },
        { status: 401 }
      );
    }

    const { id } = params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid tournament ID" },
        { status: 400 }
      );
    }

    // Get request body
    const data = await request.json();
    const { teamId } = data;

    if (!teamId || !ObjectId.isValid(teamId)) {
      return NextResponse.json({ error: "Invalid team ID" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    // Check if tournament exists
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

    // Fetch the complete team document with all information
    const team = await db.collection("Teams").findOne({
      _id: new ObjectId(teamId),
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Check if user is the team captain
    if (
      team.captain?.discordId !== session.user.id &&
      !(await isAdmin(db, session.user.id))
    ) {
      return NextResponse.json(
        {
          error:
            "You must be team captain or admin to register for tournaments",
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

    // Get player data from Players collection for accurate ELO
    const players = await db
      .collection("Players")
      .find({ discordId: { $in: memberIds } })
      .toArray();

    // Calculate team Elo based on tournament team size
    const teamSize = tournament.teamSize || 5;

    // IMPROVED VALIDATION: Check if team has enough members for the tournament
    // Count members properly, ensuring we don't double-count the captain
    let memberCount = team.members.length;

    // If captain is not already included in members array, add them to the count
    const captainInMembersArray = team.members.some(
      (member: TeamMember) => member.discordId === team.captain?.discordId
    );
    if (team.captain && !captainInMembersArray) {
      memberCount += 1;
    }

    // Debug logs (will appear in server logs)
    console.log("Required team size:", teamSize);
    console.log("Current team members:", memberCount);
    console.log(
      "Team members array:",
      team.members.map((m: any) => m.discordId)
    );
    console.log("Captain ID:", team.captain?.discordId);

    // Strictly enforce team size requirement
    if (memberCount < teamSize) {
      return NextResponse.json(
        {
          error: `Your team needs exactly ${teamSize} members to register for this tournament. Current team size: ${memberCount}`,
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
        const player = players.find((p) => p.discordId === member.discordId);

        // Find the correct ELO for this team size
        let playerElo = 0;
        if (player && player.stats && Array.isArray(player.stats)) {
          const statForSize = player.stats.find((s) => s.teamSize === teamSize);
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

    // Properly handle the captain data
    const captainPlayer = players.find(
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
        (s) => s.teamSize === teamSize
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
    const topMembers = sortedByElo.slice(0, teamSize);
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
    const result = await db.collection("Tournaments").updateOne(
      { _id: new ObjectId(id) },
      {
        $addToSet: { teams: new ObjectId(teamId) },
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

    // Return success response
    return NextResponse.json({
      success: true,
      message: "Team successfully registered for tournament",
      team: enhancedTeamData,
    });
  } catch (error) {
    console.error("Error registering team for tournament:", error);
    return NextResponse.json(
      { error: "Failed to register team for tournament" },
      { status: 500 }
    );
  }
}

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
