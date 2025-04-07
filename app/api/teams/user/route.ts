import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { db } = await connectToDatabase();

    // Find team where user is either a member or captain
    const team = await db.collection("Teams").findOne({
      $or: [
        { "members.discordId": session.user.id },
        { "captain.discordId": session.user.id },
      ],
    });

    return NextResponse.json({
      team: team
        ? {
            id: team._id.toString(),
            name: team.name,
            tag: team.tag,
            memberCount: team.members?.length || 0,
            isCaptain: team.captain?.discordId === session.user.id,
          }
        : null,
    });
  } catch (error) {
    console.error("Error fetching user team:", error);
    return NextResponse.json(
      { error: "Failed to fetch user team" },
      { status: 500 }
    );
  }
}
