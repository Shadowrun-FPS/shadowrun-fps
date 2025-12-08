import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity } from "@/lib/api-wrapper";

export const dynamic = "force-dynamic";

async function getSearchPlayersHandler(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json(
      { error: "You must be logged in to search players" },
      { status: 401 }
    );
  }

  const searchParams = req.nextUrl.searchParams;
  const termParam = searchParams.get("term");
  const term = termParam ? sanitizeString(termParam, 100) : "";
  const includeTeamInfo = searchParams.get("includeTeamInfo") === "true";

  if (!term) {
    return NextResponse.json(
      { error: "Search term is required" },
      { status: 400 }
    );
  }

  const { db } = await connectToDatabase();

  const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const searchRegex = new RegExp(escapedTerm, "i");

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
      // Get the team for each player - search across all collections
      const { getAllTeamCollectionNames } = await import("@/lib/team-collections");
      const playerIds = players.map((player) => player.discordId);

      const allCollections = getAllTeamCollectionNames();
      const teamsWithPlayers = [];
      for (const collectionName of allCollections) {
        const teams = await db
          .collection(collectionName)
          .find({ "members.discordId": { $in: playerIds } })
          .project({
            _id: 1,
            name: 1,
            teamSize: 1,
            "members.discordId": 1,
          })
          .toArray();
        teamsWithPlayers.push(...teams);
      }

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

    const response = NextResponse.json({
      players: playersWithTeamInfo,
    });
    response.headers.set(
      "Cache-Control",
      "private, no-cache, no-store, must-revalidate"
    );
    return response;
}

export const GET = withApiSecurity(getSearchPlayersHandler, {
  rateLimiter: "api",
  requireAuth: true,
});
