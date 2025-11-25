import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { findTeamAcrossCollections, getTeamCollectionName } from "@/lib/team-collections";

export async function POST(req: NextRequest) {
  try {
    const { db } = await connectToDatabase();
    const { teamId, action } = await req.json();

    // Validate ObjectId
    if (!ObjectId.isValid(teamId)) {
      return NextResponse.json(
        { error: "Invalid team ID format" },
        { status: 400 }
      );
    }

    // Find the team - search across all collections
    const teamResult = await findTeamAcrossCollections(db, teamId);
    if (!teamResult) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }
    const team = teamResult.team;
    const collectionName = teamResult.collectionName;
    const teamSize = team.teamSize || 4;

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
      // Find the stats object for this team's size in the player's stats array
      const statsForTeamSize = player.stats?.find(
        (stat: any) => stat.teamSize === teamSize
      );

      if (statsForTeamSize && statsForTeamSize.elo) {
        const playerElo = parseInt(statsForTeamSize.elo);
        playerEloMap.set(player.discordId, playerElo);

        // Store for logging
        memberElos.push({
          name: player.discordNickname || player.discordId,
          elo: playerElo,
        });
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
    await db.collection(collectionName).updateOne(
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
      message: `Team ELO updated successfully after ${action}`,
    });
  } catch (error) {
    console.error("Error updating team ELO:", error);
    return NextResponse.json(
      { error: "Failed to update team ELO" },
      { status: 500 }
    );
  }
}
