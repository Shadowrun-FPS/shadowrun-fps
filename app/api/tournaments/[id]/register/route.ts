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

    // Get complete team data with members
    const team = await db.collection("Teams").findOne({
      _id: new ObjectId(teamId),
      "captain.discordId": session.user.id,
    });

    if (!team) {
      return NextResponse.json(
        { error: "You must be team captain to register for tournaments" },
        { status: 403 }
      );
    }

    // Get team members with more detailed information
    const memberIds = team.members.map((member: any) => member.discordId);

    // Get user profiles from Users collection
    const users = await db
      .collection("Users")
      .find({ discordId: { $in: memberIds } })
      .toArray();

    // Get player data from Players collection for accurate ELO
    const players = await db
      .collection("Players")
      .find({ discordId: { $in: memberIds } })
      .toArray();

    // Get team captain data
    const captainUser = await db
      .collection("Users")
      .findOne({ discordId: team.captain.discordId });

    const captainPlayer = await db
      .collection("Players")
      .findOne({ discordId: team.captain.discordId });

    // Calculate team Elo based on tournament team size
    const teamSize = tournament.teamSize || 5;

    // Map player data with elo from Players collection
    const enhancedMembers = team.members.map((member: any) => {
      const player =
        players.find((p: any) => p.discordId === member.discordId) ||
        ({} as any);

      return {
        discordId: member.discordId,
        discordUsername: member.discordUsername || "Unknown",
        discordNickname: member.discordNickname || null,
        discordProfilePicture: member.discordProfilePicture || null,
        role: member.role || "member",
        joinedAt: member.joinedAt || new Date().toISOString(),
        elo: player.elo || 0,
      };
    });

    // Sort by ELO to get top players for team size
    const sortedMembersByElo = [...enhancedMembers].sort(
      (a, b) => b.elo - a.elo
    );
    const topMembers = sortedMembersByElo.slice(0, teamSize);
    const teamElo = topMembers.reduce((sum, member) => sum + member.elo, 0);

    // Enhanced team data with accurate information
    const enhancedTeamData = {
      _id: team._id.toString(),
      name: team.name,
      tag: team.tag || "",
      teamElo: teamElo,
      members: enhancedMembers,
      captain: {
        discordId: team.captain.discordId,
        discordUsername: captainUser?.username || "Unknown",
        discordNickname: captainUser?.nickname || undefined,
        discordProfilePicture: captainUser?.image || undefined,
        elo: captainPlayer?.elo || 0,
      },
    };

    // Register team for tournament
    const result = await db.collection("Tournaments").updateOne(
      { _id: new ObjectId(id) },
      {
        $addToSet: { teams: new ObjectId(teamId) } as any,
        $push: {
          registeredTeams: enhancedTeamData as any,
        },
        $set: { updatedAt: new Date() },
      }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        {
          error: "Failed to register team. Tournament may have been modified.",
        },
        { status: 400 }
      );
    }

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
