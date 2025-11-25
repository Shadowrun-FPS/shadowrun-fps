import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAllTeamCollectionNames } from "@/lib/team-collections";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be logged in" },
        { status: 401 }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    // Find the team where the user is a member - search across all collections
    const allCollections = getAllTeamCollectionNames();
    let team = null;
    for (const collectionName of allCollections) {
      team = await db.collection(collectionName).findOne({
        "members.discordId": session.user.id,
      });
      if (team) break;
    }

    if (!team) {
      return NextResponse.json({ team: null });
    }

    // Convert MongoDB ObjectId to string
    return NextResponse.json({
      team: {
        ...team,
        _id: team._id.toString(),
        members: team.members.map((member: { _id?: any }) => ({
          ...member,
          _id: member._id?.toString(),
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching user team:", error);
    return NextResponse.json(
      { error: "Failed to fetch user team" },
      { status: 500 }
    );
  }
}
