import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ObjectId } from "mongodb";

// Add this line to force dynamic rendering
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    // Get current session
    const session = await getServerSession(authOptions);

    // Connect to database
    const { db } = await connectToDatabase();

    const scrimmagesCollection = db.collection("Scrimmages");

    // Check for teamId query parameter
    const { searchParams } = new URL(req.url);
    const teamIdParam = searchParams.get("teamId");

    // Now that we've debugged, let's create proper queries for signed-in and signed-out users
    let query: any;
    let userTeam = null;

    // If teamId is provided in query, filter by that team
    if (teamIdParam) {
      query = {
        $or: [
          { challengerTeamId: teamIdParam },
          { challengedTeamId: teamIdParam },
        ],
      };
    } else if (session?.user) {
      // If user is logged in, include pending scrimmages for their team
      // Fetch user's team - search across all collections
      const { getAllTeamCollectionNames } = await import("@/lib/team-collections");
      const allCollections = getAllTeamCollectionNames();
      for (const collectionName of allCollections) {
        userTeam = await db.collection(collectionName).findOne({
          "members.discordId": session.user.id,
        });
        if (userTeam) break;
      }

      if (userTeam) {
        // Include pending scrimmages for the user's team
        query = {
          $or: [
            { status: { $in: ["completed", "accepted"] } },
            {
              status: "pending",
              $or: [
                { challengerTeamId: userTeam._id.toString() },
                { challengedTeamId: userTeam._id.toString() },
              ],
            },
          ],
        };
      } else {
        // User is logged in but not in a team - show only completed/accepted
        query = { status: { $in: ["completed", "accepted"] } };
      }
    } else {
      // Not logged in - only show completed/accepted scrimmages
      query = { status: { $in: ["completed", "accepted"] } };
    }

    // Fetch scrimmages based on query
    const scrimmages = await scrimmagesCollection
      .find(query)
      .sort({ proposedDate: -1 })
      .toArray();

    // Convert ObjectIds to strings for JSON serialization
    // Create a new array with transformed objects to avoid type issues
    const serializedScrimmages = scrimmages.map((scrimmage) => {
      // Create a new object instead of modifying
      return {
        ...scrimmage,
        _id: scrimmage._id.toString(),
        // Also convert other ObjectId fields if they exist
        challengerTeamId: scrimmage.challengerTeamId?.toString(),
        challengedTeamId: scrimmage.challengedTeamId?.toString(),
      };
    });

    // Also return user team if available to avoid separate API call (only when not filtering by teamId)
    let serializedUserTeam = null;
    if (!teamIdParam && session?.user && userTeam) {
      serializedUserTeam = {
        ...userTeam,
        _id: userTeam._id.toString(),
        members: userTeam.members?.map((member: any) => ({
          ...member,
          _id: member._id?.toString(),
        })) || [],
      };
    }

    // If teamId is provided, return array for backward compatibility
    // Otherwise return object with scrimmages and userTeam
    if (teamIdParam) {
      return NextResponse.json(serializedScrimmages);
    }

    // Return both scrimmages and user team to reduce API calls
    return NextResponse.json({
      scrimmages: serializedScrimmages,
      userTeam: serializedUserTeam,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch scrimmages" },
      { status: 500 }
    );
  }
}
