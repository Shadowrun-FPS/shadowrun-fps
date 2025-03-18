import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";

// Add this line to mark route as dynamic
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be logged in to view your teams" },
        { status: 401 }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    // Find teams where the user is captain
    const teams = await db
      .collection("Teams")
      .find({
        "captain.discordId": session.user.id,
      })
      .toArray();

    // Convert ObjectId to string
    const formattedTeams = teams.map((team) => ({
      ...team,
      _id: team._id.toString(),
    }));

    return NextResponse.json({
      teams: formattedTeams,
    });
  } catch (error) {
    console.error("Error fetching user teams:", error);
    return NextResponse.json(
      { error: "Failed to fetch teams" },
      { status: 500 }
    );
  }
}
