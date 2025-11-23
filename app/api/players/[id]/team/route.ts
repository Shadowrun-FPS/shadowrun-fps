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

    // Find team where player is a member
    const team = await db.collection("Teams").findOne({
      "members.discordId": playerId,
    });

    if (!team) {
      return NextResponse.json({ team: null });
    }

    // Get player's role in the team
    const member = team.members.find(
      (m: any) => m.discordId === playerId
    );
    const isCaptain = team.captain?.discordId === playerId;

    return NextResponse.json({
      team: {
        _id: team._id.toString(),
        name: team.name,
        tag: team.tag,
        description: team.description,
        teamElo: team.teamElo,
        wins: team.wins || 0,
        losses: team.losses || 0,
        tournamentWins: team.tournamentWins || 0,
        memberCount: team.members?.length || 0,
      },
      role: isCaptain ? "captain" : member?.role || "member",
      isCaptain,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch team information" },
      { status: 500 }
    );
  }
}

