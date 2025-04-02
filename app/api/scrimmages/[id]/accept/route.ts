import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("User ID:", session.user.id);

    const { db } = await connectToDatabase();

    // Get the scrimmage
    const scrimmage = await db.collection("Scrimmages").findOne({
      _id: new ObjectId(params.id),
    });

    if (!scrimmage) {
      return NextResponse.json(
        { error: "Scrimmage not found" },
        { status: 404 }
      );
    }

    console.log("Scrimmage:", JSON.stringify(scrimmage, null, 2));

    // The issue might be that the captain info is not properly populated
    // Let's fetch the team directly to get the captain info
    const challengedTeam = await db.collection("Teams").findOne({
      _id: new ObjectId(scrimmage.challengedTeamId),
    });

    console.log("Challenged Team:", JSON.stringify(challengedTeam, null, 2));

    // Verify user is authorized to accept the scrimmage
    const isAdmin = session.user.roles?.includes("admin");
    console.log("Is Admin:", isAdmin);

    // Check if user is captain of challenged team
    const isTeamBCaptain =
      session.user.id === challengedTeam?.captain?.discordId;
    console.log("Is Team B Captain:", isTeamBCaptain);
    console.log("Session User ID:", session.user.id);
    console.log("Team B Captain ID:", challengedTeam?.captain?.discordId);

    if (!isAdmin && !isTeamBCaptain) {
      return NextResponse.json(
        {
          error:
            "Only the challenged team captain or an admin can accept a challenge",
          userId: session.user.id,
          captainId: challengedTeam?.captain?.discordId,
        },
        { status: 403 }
      );
    }

    // Update the scrimmage status to accepted
    await db.collection("Scrimmages").updateOne(
      { _id: new ObjectId(params.id) },
      {
        $set: {
          status: "accepted",
          acceptedAt: new Date(),
          scrimmageId: new ObjectId().toString(), // Generate and store a scrimmageId
        },
      }
    );

    // Get the updated scrimmage
    const updatedScrimmage = await db.collection("Scrimmages").findOne({
      _id: new ObjectId(params.id),
    });

    return NextResponse.json(updatedScrimmage);
  } catch (error) {
    console.error("Error accepting scrimmage:", error);
    return NextResponse.json(
      { error: "Failed to accept scrimmage" },
      { status: 500 }
    );
  }
}
