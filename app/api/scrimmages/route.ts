import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ObjectId } from "mongodb";

// Add this line to force dynamic rendering
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    // Get current session
    const session = await getServerSession(authOptions);

    // Connect to database
    const client = await clientPromise;
    const db = client.db();

    // Log to confirm we're connected to database
    console.log("Connected to database");

    const scrimmagesCollection = db.collection("Scrimmages");

    // Now that we've debugged, let's create proper queries for signed-in and signed-out users
    let query: any;

    // If user is logged in, include pending scrimmages for their team
    if (session?.user) {
      // Fetch user's team
      const teamsCollection = db.collection("Teams");
      const userTeam = await teamsCollection.findOne({
        "members.discordId": session.user.id,
      });

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

    console.log(`Found ${scrimmages.length} scrimmages with query`);

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

    return NextResponse.json(serializedScrimmages);
  } catch (error) {
    console.error("Error fetching scrimmages:", error);
    return NextResponse.json(
      { error: "Failed to fetch scrimmages" },
      { status: 500 }
    );
  }
}
