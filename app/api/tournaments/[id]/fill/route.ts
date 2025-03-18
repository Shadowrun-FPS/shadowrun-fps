import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// POST endpoint to fill a tournament with random teams (testing only)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log("Fill route hit with ID:", params.id);

    const session = await getServerSession(authOptions);

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
      session.user.id === "238329746671271936" || // Add your specific ID for testing
      false;

    if (!isAdmin) {
      return NextResponse.json(
        { error: "You must be an administrator to perform this action" },
        { status: 403 }
      );
    }

    // Get random teams
    const maxTeams = tournament.maxTeams || 8;
    const teams = await db
      .collection("Teams")
      .find({})
      .limit(maxTeams)
      .toArray();

    if (teams.length === 0) {
      return NextResponse.json(
        { error: "No teams found in the database" },
        { status: 400 }
      );
    }

    // Improved data retrieval for team members
    const enhancedTeams = await Promise.all(
      teams.map(async (team) => {
        // Get team members
        const teamMembers = await db
          .collection("TeamMembers")
          .find({ teamId: team._id })
          .toArray();

        // Fetch players
        const playerIds = teamMembers.map((member) => member.discordId);
        const players = await db
          .collection("Players")
          .find({ discordId: { $in: playerIds } })
          .toArray();

        // Format team members first so it's available for ELO calculation
        const formattedMembers = teamMembers.map((member: any) => {
          const player = players.find(
            (p: any) => p.discordId === member.discordId
          );

          return {
            discordId: member.discordId,
            discordUsername: member.discordUsername || "Unknown",
            discordNickname: member.discordNickname || null,
            discordProfilePicture: member.discordProfilePicture || "",
            role: member.role || "member",
            joinedAt: member.joinedAt || new Date().toISOString(),
            elo: player?.elo || 0,
          };
        });

        // Fetch the actual team document to get proper ELO
        const completeTeam = await db
          .collection("Teams")
          .findOne({ _id: team._id });

        // Use team's stored ELO value first
        let teamElo = completeTeam?.teamElo || 0;

        // If no stored value, calculate from members
        if (!teamElo) {
          const teamSize = tournament.teamSize || 5;
          const sortedByElo = [...formattedMembers].sort(
            (a, b) => (b.elo || 0) - (a.elo || 0)
          );
          const topMembers = sortedByElo.slice(0, teamSize);
          teamElo = topMembers.reduce(
            (sum, member) => sum + (member.elo || 0),
            0
          );
        }

        // Format captain data
        const captain = team.captain || {};
        const captainPlayer = players.find(
          (p: any) => p.discordId === captain.discordId
        );

        const captainData = {
          discordId: captain.discordId || "",
          discordUsername: captain.discordUsername || "Unknown",
          discordNickname: captain.discordNickname || null,
          discordProfilePicture: captain.discordProfilePicture || "",
          elo: captainPlayer?.elo || 0,
        };

        return {
          _id: team._id.toString(),
          name: team.name,
          tag: team.tag || "",
          description: team.description || "",
          teamElo,
          members: formattedMembers,
          captain: captainData,
        };
      })
    );

    // Update tournament with teams
    const teamIds = teams.map((team) => team._id);

    await db.collection("Tournaments").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          teams: teamIds,
          registeredTeams: enhancedTeams,
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json({
      success: true,
      message: `Tournament filled with ${teams.length} random teams`,
    });
  } catch (error) {
    console.error("Error filling tournament:", error);
    return NextResponse.json(
      { error: "Failed to fill tournament" },
      { status: 500 }
    );
  }
}
