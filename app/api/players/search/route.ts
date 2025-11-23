import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be logged in to search players" },
        { status: 401 }
      );
    }

    const searchParams = req.nextUrl.searchParams;
    const term = searchParams.get("term");
    const includeTeamInfo = searchParams.get("includeTeamInfo") === "true";

    if (!term) {
      return NextResponse.json(
        { error: "Search term is required" },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    // Find players that match the search term
    const searchRegex = new RegExp(term, "i");

    const players = await db
      .collection("Players")
      .find({
        $or: [
          { discordNickname: { $regex: searchRegex } },
          { discordUsername: { $regex: searchRegex } },
        ],
      })
      .project({
        discordId: 1,
        discordNickname: 1,
        discordUsername: 1,
        discordProfilePicture: 1,
        elo: 1,
      })
      .limit(10)
      .toArray();

    // If we need to include team info, let's get that too
    let playersWithTeamInfo = players;

    if (includeTeamInfo) {
      // Get the team for each player
      const playerIds = players.map((player) => player.discordId);

      const teamsWithPlayers = await db
        .collection("Teams")
        .find({ "members.discordId": { $in: playerIds } })
        .project({
          _id: 1,
          name: 1,
          teamSize: 1,
          "members.discordId": 1,
        })
        .toArray();

      // Create a map of player ID to team
      const playerTeamMap = new Map();
      teamsWithPlayers.forEach((team) => {
        team.members.forEach((member: any) => {
          playerTeamMap.set(member.discordId, {
            id: team._id,
            name: team.name,
            teamSize: team.teamSize || 4,
          });
        });
      });

      // Add team info to each player
      playersWithTeamInfo = players.map((player) => ({
        id: player.discordId,
        name: player.discordNickname || player.discordUsername,
        username: player.discordUsername,
        elo: player.elo || 0,
        team: playerTeamMap.get(player.discordId) || null,
        profilePicture: player.discordProfilePicture || null,
      }));
    } else {
      // Format the response without team info
      playersWithTeamInfo = players.map((player) => ({
        id: player.discordId,
        name: player.discordNickname || player.discordUsername,
        username: player.discordUsername,
        elo: player.elo || 0,
        profilePicture: player.discordProfilePicture || null,
      }));
    }

    return NextResponse.json({
      players: playersWithTeamInfo,
    });
  } catch (error) {
    console.error("Error searching players:", error);
    return NextResponse.json(
      { error: "Failed to search players" },
      { status: 500 }
    );
  }
}
