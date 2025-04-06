import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";

// Add this line to mark the route as dynamic
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    console.log("Checking team membership for user:", userId);
    const { db } = await connectToDatabase();

    // Find a team where the user is a member
    const team = await db.collection("Teams").findOne(
      {
        "members.discordId": userId,
      },
      {
        projection: {
          _id: 1,
          name: 1,
          tag: 1,
          "captain.discordId": 1,
        },
      }
    );

    console.log("Found team:", team ? team.name : "None");

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
