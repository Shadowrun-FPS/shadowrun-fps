import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ObjectId } from "mongodb";

// Add this line to force dynamic rendering
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be logged in" },
        { status: 401 }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    // Get user's team
    const userTeam = await db.collection("Teams").findOne({
      "members.discordId": session.user.id,
    });

    // If user is not in a team, return empty array
    if (!userTeam) {
      return NextResponse.json([]);
    }

    // Find scrimmages where the user's team is involved
    const scrimmages = await db
      .collection("Scrimmages")
      .find({
        $or: [
          { challengerTeamId: userTeam._id.toString() },
          { challengedTeamId: userTeam._id.toString() },
        ],
      })
      .sort({ createdAt: -1 })
      .toArray();

    console.log(
      `Found ${scrimmages.length} scrimmages for team ${userTeam.name}`
    );

    // Convert ObjectIds to strings for JSON serialization
    const serializedScrimmages = scrimmages.map((scrimmage) => {
      // Create a copy of the scrimmage object to avoid modifying the original
      const serialized = { ...scrimmage };

      // Convert ObjectId to string
      if (serialized._id) {
        serialized._id = serialized._id.toString() as any;
      }

      return serialized;
    });

    return NextResponse.json(serializedScrimmages);
  } catch (error) {
    console.error("Error fetching scrimmages:", error);
    return NextResponse.json(
      { error: "Failed to fetch scrimmages" },
      { status: 500 }
    );
  }
}
