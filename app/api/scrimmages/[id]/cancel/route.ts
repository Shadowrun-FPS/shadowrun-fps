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

    // Verify user is authorized to cancel the scrimmage
    const isAdmin = session.user.roles?.includes("admin");
    const isTeamACaptain =
      session.user.id === scrimmage.challengerTeam?.captain?.discordId;
    const isTeamBCaptain =
      session.user.id === scrimmage.challengedTeam?.captain?.discordId;

    if (!isAdmin && !isTeamACaptain && !isTeamBCaptain) {
      return NextResponse.json(
        { error: "You are not authorized to cancel this scrimmage" },
        { status: 403 }
      );
    }

    // Delete the scrimmage
    await db.collection("Scrimmages").deleteOne({
      _id: new ObjectId(params.id),
    });

    return NextResponse.json({ success: true, message: "Scrimmage canceled" });
  } catch (error) {
    console.error("Error canceling scrimmage:", error);
    return NextResponse.json(
      { error: "Failed to cancel scrimmage" },
      { status: 500 }
    );
  }
}
