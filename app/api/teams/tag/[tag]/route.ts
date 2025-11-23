import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { recalculateTeamElo } from "@/lib/team-elo-calculator";
import { ObjectId } from "mongodb";

export async function GET(
  req: NextRequest,
  { params }: { params: { tag: string } }
) {
  try {
    const { db } = await connectToDatabase();
    const tag = params.tag;

    // Find the team by tag
    const team = await db.collection("Teams").findOne({ tag });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Automatically recalculate team ELO based on current member ELOs
    // This ensures team ELO is always up-to-date when the page loads
    if (team.members && team.members.length > 0 && team._id) {
      try {
        const updatedElo = await recalculateTeamElo(team._id.toString());
        // Update team object with fresh ELO
        team.teamElo = updatedElo;
      } catch (error) {
        // Silently fail - don't block team data if ELO calculation fails
        console.error("Failed to auto-calculate team ELO:", error);
      }
    }

    // Convert ObjectId to string for JSON serialization
    const teamWithStringId = {
      ...team,
      _id: team._id.toString(),
    };

    return NextResponse.json(teamWithStringId);
  } catch (error) {
    console.error("Error fetching team by tag:", error);
    return NextResponse.json(
      { error: "Failed to fetch team" },
      { status: 500 }
    );
  }
}
