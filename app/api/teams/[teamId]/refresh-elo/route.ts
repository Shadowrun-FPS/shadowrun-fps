import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

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

    // Validate ObjectId
    if (!ObjectId.isValid(teamId)) {
      return NextResponse.json(
        { error: "Invalid team ID format" },
        { status: 400 }
      );
    }

    // Find the team
    const team = await db.collection("Teams").findOne({
      _id: new ObjectId(teamId),
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Check if user is the team captain or has admin privileges
    const isAdmin =
      session.user.id === "238329746671271936" ||
      (Array.isArray(session.user.roles) &&
        session.user.roles.includes("admin"));

    const isTeamCaptain = team.captain.discordId === session.user.id;

    // Also accept the isAdminRequest flag from the request body
    const { isAdminRequest } = await req.json().catch(() => ({}));

    if (!isTeamCaptain && !isAdmin && !isAdminRequest) {
      return NextResponse.json(
        { error: "Only the team captain or admins can refresh team ELO" },
        { status: 403 }
      );
    }

    // Get all team members' IDs
    const memberIds = team.members.map((member: any) => member.discordId);

    // Fetch player stats for all team members
    const players = await db
      .collection("Players")
      .find({ discordId: { $in: memberIds } })
      .toArray();

    // Create a map of discordId to player ELO for quick lookup
    const playerEloMap = new Map();
    let memberElos = [];

    for (const player of players) {
      // Find the 4v4 stats object in the player's stats array
      const teamSize4Stats = player.stats?.find(
        (stat: any) => stat.teamSize === 4
      );

      if (teamSize4Stats && teamSize4Stats.elo) {
        const playerElo = parseInt(teamSize4Stats.elo);
        playerEloMap.set(player.discordId, playerElo);

        // Store for logging
        memberElos.push({
          name: player.discordNickname || player.discordId,
          elo: playerElo,
        });

        console.log(
          `Player ${
            player.discordNickname || player.discordId
          } ELO: ${playerElo}`
        );
      }
    }

    // Update each member's ELO in the team document
    const updatedMembers = team.members.map((member: any) => {
      const currentElo = playerEloMap.get(member.discordId);
      if (currentElo) {
        return {
          ...member,
          elo: currentElo,
        };
      }
      return member;
    });

    // Calculate the total team ELO
    const totalElo = updatedMembers.reduce((sum: number, member: any) => {
      return sum + (member.elo || 0);
    }, 0);

    console.log(`Member ELOs:`, memberElos);
    console.log(`Total team ELO: ${totalElo}`);

    // Update the team document with updated members and team ELO
    await db.collection("Teams").updateOne(
      { _id: new ObjectId(teamId) },
      {
        $set: {
          members: updatedMembers,
          teamElo: totalElo,
        },
      }
    );

    return NextResponse.json({
      success: true,
      teamElo: totalElo,
      message: "Team ELO refreshed successfully",
    });
  } catch (error) {
    console.error("Error refreshing team ELO:", error);
    return NextResponse.json(
      { error: "Failed to refresh team ELO" },
      { status: 500 }
    );
  }
}
