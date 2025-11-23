import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { db } = await connectToDatabase();
    const playerId = params.id;

    // Find all teams where player is a member
    const teams = await db.collection("Teams").find({
      "members.discordId": playerId,
    }).toArray();

    if (!teams || teams.length === 0) {
      return NextResponse.json({ teams: [] });
    }

    // Map teams with player's role information
    const teamsWithRole = teams.map((team) => {
      const member = team.members.find(
        (m: any) => m.discordId === playerId
      );
      const isCaptain = team.captain?.discordId === playerId;

      return {
        _id: team._id.toString(),
        name: team.name,
        tag: team.tag,
        description: team.description,
        teamElo: team.teamElo,
        wins: team.wins || 0,
        losses: team.losses || 0,
        tournamentWins: team.tournamentWins || 0,
        memberCount: team.members?.length || 0,
        teamSize: team.teamSize || 4,
        role: isCaptain ? "captain" : member?.role || "member",
        isCaptain,
      };
    });

    // Sort teams: 4v4 first, then by team size (2, 3, 5)
    teamsWithRole.sort((a, b) => {
      // 4v4 teams first
      if (a.teamSize === 4 && b.teamSize !== 4) return -1;
      if (b.teamSize === 4 && a.teamSize !== 4) return 1;
      // Then sort by team size (2, 3, 5)
      return a.teamSize - b.teamSize;
    });

    return NextResponse.json({ teams: teamsWithRole });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch team information" },
      { status: 500 }
    );
  }
}

