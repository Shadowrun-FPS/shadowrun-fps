import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { getAllTeamCollectionNames } from "@/lib/team-collections";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { db } = await connectToDatabase();

    // Get all teams where the user is a member across all collections
    const allCollections = getAllTeamCollectionNames();
    const allTeams = [];
    
    for (const collectionName of allCollections) {
      const teams = await db
        .collection(collectionName)
        .find({
          "members.discordId": session.user.id,
        })
        .toArray();
      allTeams.push(...teams);
    }
    
    const teams = allTeams;

    return NextResponse.json({ teams });
  } catch (error) {
    console.error("Error fetching user teams:", error);
    return NextResponse.json(
      { error: "Failed to fetch user teams" },
      { status: 500 }
    );
  }
}
