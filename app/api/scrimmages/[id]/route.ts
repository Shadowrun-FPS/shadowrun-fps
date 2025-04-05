import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { db } = await connectToDatabase();
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const scrimmageId = params.id;
    console.log(`Attempting to fetch scrimmage with ID: ${scrimmageId}`);

    // Try to find the scrimmage by _id first
    let scrimmage = null;
    const queries = [];

    // Try multiple query strategies
    try {
      queries.push({ _id: new ObjectId(scrimmageId) });
    } catch (error) {
      console.log("ID is not a valid ObjectId, will try string formats");
    }

    // Also try by scrimmageId field
    queries.push({ scrimmageId: scrimmageId });

    // And try as a string representation of ObjectId
    if (ObjectId.isValid(scrimmageId)) {
      queries.push({ _id: scrimmageId });
    }

    // Try up to 5 times with increasing delays to handle race conditions
    for (let attempt = 0; attempt < 5; attempt++) {
      console.log(`Scrimmage fetch attempt ${attempt + 1}/5`);

      // Try all query strategies
      for (const query of queries) {
        try {
          // Use type assertion to help TypeScript understand the query type
          scrimmage = await db.collection("Scrimmages").findOne(query as any);
          if (scrimmage) {
            console.log(`Found scrimmage with query:`, query);
            break;
          }
        } catch (error) {
          console.error(`Error with query ${JSON.stringify(query)}:`, error);
        }
      }

      if (scrimmage) break;

      // If not found and not the last attempt, wait before trying again
      if (attempt < 4) {
        const delay = 750 * (attempt + 1);
        console.log(`Scrimmage not found, retrying in ${delay}ms`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    // Last resort: try to find a recently created scrimmage for this user
    if (!scrimmage && session.user.id) {
      console.log("Trying to find a recently created scrimmage for this user");

      // Find teams where this user is captain
      const userTeams = await db
        .collection("Teams")
        .find({
          "members.discordId": session.user.id,
        })
        .toArray();

      const teamIds = userTeams.map((team) => team._id.toString());

      if (teamIds.length > 0) {
        // Find most recent scrimmage involving any of these teams
        scrimmage = await db.collection("Scrimmages").findOne(
          {
            $or: [
              { challengerTeamId: { $in: teamIds } },
              { challengedTeamId: { $in: teamIds } },
            ],
            createdAt: { $gte: new Date(Date.now() - 5 * 60 * 1000) }, // Within last 5 minutes
          },
          { sort: { createdAt: -1 } }
        );

        if (scrimmage) {
          console.log("Found recent scrimmage as fallback:", scrimmage._id);
        }
      }
    }

    if (!scrimmage) {
      console.log(`Scrimmage not found after all attempts`);
      return NextResponse.json(
        { error: "Scrimmage not found" },
        { status: 404 }
      );
    }

    // Ensure the teams are properly populated
    if (!scrimmage.challengerTeam || !scrimmage.challengedTeam) {
      console.log("Populating team data for scrimmage");
      try {
        const teams = await Promise.all([
          db.collection("Teams").findOne({
            _id: new ObjectId(scrimmage.challengerTeamId.toString()),
          }),
          db.collection("Teams").findOne({
            _id: new ObjectId(scrimmage.challengedTeamId.toString()),
          }),
        ]);

        scrimmage.challengerTeam = teams[0];
        scrimmage.challengedTeam = teams[1];
      } catch (error) {
        console.error("Error populating team data:", error);
        // Continue with the incomplete scrimmage data rather than failing
      }
    }

    return NextResponse.json(scrimmage);
  } catch (error) {
    console.error("Error fetching scrimmage:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch scrimmage details",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is authorized to delete scrimmages
    const isAdmin = session.user.roles?.includes("admin");
    const isSpecificUser = session.user.id === "238329746671271936";

    if (!isAdmin && !isSpecificUser) {
      return NextResponse.json(
        { error: "You are not authorized to delete scrimmages" },
        { status: 403 }
      );
    }

    const { db } = await connectToDatabase();
    const scrimmageId = params.id;

    // Try to delete by _id first
    let result;
    try {
      result = await db.collection("Scrimmages").deleteOne({
        _id: new ObjectId(scrimmageId),
      });
    } catch (error) {
      // If _id is not a valid ObjectId, try by scrimmageId field
      result = await db.collection("Scrimmages").deleteOne({
        scrimmageId: scrimmageId,
      });
    }

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Scrimmage not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting scrimmage:", error);
    return NextResponse.json(
      { error: "Failed to delete scrimmage" },
      { status: 500 }
    );
  }
}
