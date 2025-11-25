import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// Add these type interfaces at the top of the file
interface PlayerStat {
  teamSize: number;
  elo: number;
  // Add other properties that exist in the stats object
}

interface Player {
  _id: string;
  discordId: string;
  discordUsername: string;
  stats?: PlayerStat[];
  // Add other properties that exist in your player object
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be logged in to perform this action" },
        { status: 401 }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    // Check if user is admin
    const user = await db.collection("Users").findOne({
      discordId: session.user.id,
    });

    if (!user?.roles?.includes("admin")) {
      return NextResponse.json(
        { error: "You must be an administrator to perform this action" },
        { status: 403 }
      );
    }

    // Get all tournaments
    const tournaments = await db.collection("Tournaments").find({}).toArray();

    let updatedCount = 0;

    // Process each tournament
    for (const tournament of tournaments) {
      if (
        !tournament.registeredTeams ||
        !Array.isArray(tournament.registeredTeams)
      ) {
        continue;
      }

      let updated = false;

      // Process each registered team
      for (let i = 0; i < tournament.registeredTeams.length; i++) {
        const team = tournament.registeredTeams[i];

        // Skip if team has valid members
        if (
          team.members &&
          Array.isArray(team.members) &&
          team.members.length > 0
        ) {
          continue;
        }

        // Fetch the complete team document - search across all collections
        const { findTeamAcrossCollections } = await import("@/lib/team-collections");
        const teamIdStr = typeof team._id === "string" ? team._id : team._id.toString();
        const teamResult = await findTeamAcrossCollections(db, teamIdStr);
        if (!teamResult) continue;
        const teamDoc = teamResult.team;

        if (!teamDoc) continue;

        // Make sure we have members
        if (!teamDoc.members || !Array.isArray(teamDoc.members)) {
          continue;
        }

        // Get all players
        const memberIds = teamDoc.members.map((m: any) => m.discordId);
        const players = await db
          .collection("Players")
          .find({ discordId: { $in: memberIds } })
          .toArray();

        // Calculate team ELO
        const teamSize = tournament.teamSize || 5;
        const enhancedMembers = teamDoc.members.map((member: any) => {
          const player =
            players.find((p) => p.discordId === member.discordId) || {};

          let playerElo = 0;
          // Use type assertion to tell TypeScript this is a Player with stats
          if (
            player &&
            (player as Player).stats &&
            Array.isArray((player as Player).stats)
          ) {
            const statForSize = (player as Player).stats!.find(
              (s: PlayerStat) => s.teamSize === teamSize
            );
            if (statForSize && typeof statForSize.elo === "number") {
              playerElo = statForSize.elo;
            }
          }

          return {
            discordId: member.discordId,
            discordUsername: member.discordUsername || "Unknown",
            discordNickname: member.discordNickname || null,
            discordProfilePicture: member.discordProfilePicture || null,
            role: member.role || "member",
            elo: playerElo,
          };
        });

        // Calculate team ELO
        const sortedByElo = [...enhancedMembers].sort((a, b) => b.elo - a.elo);
        const topMembers = sortedByElo.slice(0, teamSize);
        const teamElo = topMembers.reduce((sum, m) => sum + m.elo, 0);

        // Update the team in the tournament
        tournament.registeredTeams[i] = {
          ...team,
          members: enhancedMembers,
          teamElo: teamElo,
        };

        updated = true;
      }

      // Save the tournament if changes were made
      if (updated) {
        await db
          .collection("Tournaments")
          .updateOne(
            { _id: tournament._id },
            { $set: { registeredTeams: tournament.registeredTeams } }
          );
        updatedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Fixed data for ${updatedCount} tournaments`,
    });
  } catch (error) {
    console.error("Error fixing tournament teams:", error);
    return NextResponse.json(
      { error: "Failed to fix tournament teams data" },
      { status: 500 }
    );
  }
}
