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

    // Verify user is authorized to reject the scrimmage
    const isAdmin = session.user.roles?.includes("admin");
    const isTeamBCaptain =
      session.user.id === scrimmage.challengedTeam?.captain?.discordId;

    if (!isAdmin && !isTeamBCaptain) {
      return NextResponse.json(
        {
          error:
            "Only the challenged team captain or an admin can reject a challenge",
        },
        { status: 403 }
      );
    }

    // Update the scrimmage status to rejected
    await db.collection("Scrimmages").updateOne(
      { _id: new ObjectId(params.id) },
      {
        $set: {
          status: "rejected",
          rejectedAt: new Date(),
        },
      }
    );

    // Get the updated scrimmage
    const updatedScrimmage = await db.collection("Scrimmages").findOne({
      _id: new ObjectId(params.id),
    });

    return NextResponse.json(updatedScrimmage);
  } catch (error) {
    console.error("Error rejecting scrimmage:", error);
    return NextResponse.json(
      { error: "Failed to reject scrimmage" },
      { status: 500 }
    );
  }
}
