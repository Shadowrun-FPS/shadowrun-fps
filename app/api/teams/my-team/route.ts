import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { getAllTeamCollectionNames } from "@/lib/team-collections";

// Add this line to mark the route as dynamic
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { db } = await connectToDatabase();

    // Find a team where the user is a member across all collections
    const allCollections = getAllTeamCollectionNames();
    let team = null;
    
    for (const collectionName of allCollections) {
      team = await db.collection(collectionName).findOne(
        {
          "members.discordId": userId,
        },
        {
          projection: {
            _id: 1,
            name: 1,
            tag: 1,
            teamSize: 1,
            "captain.discordId": 1,
          },
        }
      );
      if (team) break; // Found a team, stop searching
    }

    return NextResponse.json({
      team: team || null,
      isTeamMember: !!team,
      isCaptain: team ? team.captain?.discordId === userId : false,
    });
  } catch (error) {
    console.error("Error retrieving user's team:", error);
    return NextResponse.json(
      { error: "Failed to retrieve user's team" },
      { status: 500 }
    );
  }
}
