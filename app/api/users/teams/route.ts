import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { getAllTeamCollectionNames } from "@/lib/team-collections";

// Add this line to mark route as dynamic
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be logged in to view your teams" },
        { status: 401 }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    // Check if we should return all teams (captain + member) or just captain teams
    const { searchParams } = new URL(request.url);
    const includeAll = searchParams.get("all") === "true";

    const allCollections = getAllTeamCollectionNames();
    const captainTeams: any[] = [];
    const memberTeams: any[] = [];
    
    // Fetch both captain and member teams in parallel if needed
    if (includeAll) {
      await Promise.all(
        allCollections.map(async (collectionName) => {
          const [captain, member] = await Promise.all([
            db.collection(collectionName).find({
              "captain.discordId": session.user.id,
            }).toArray(),
            db.collection(collectionName).find({
              "members.discordId": session.user.id,
            }).toArray(),
          ]);
          captainTeams.push(...captain);
          memberTeams.push(...member);
        })
      );
    } else {
      // Only fetch captain teams (backward compatibility)
      for (const collectionName of allCollections) {
        const teams = await db
          .collection(collectionName)
          .find({
            "captain.discordId": session.user.id,
          })
          .toArray();
        captainTeams.push(...teams);
      }
    }

    // Convert ObjectId to string
    const formattedCaptainTeams = captainTeams.map((team) => ({
      ...team,
      _id: team._id.toString(),
    }));

    if (includeAll) {
      const formattedMemberTeams = memberTeams.map((team) => ({
        ...team,
        _id: team._id.toString(),
      }));
      
      // Remove duplicates (user might be captain and member of same team)
      const teamIds = new Set(formattedCaptainTeams.map((t: any) => t._id));
      const uniqueMemberTeams = formattedMemberTeams.filter(
        (t: any) => !teamIds.has(t._id)
      );

      return NextResponse.json({
        teams: [...formattedCaptainTeams, ...uniqueMemberTeams],
        captainTeams: formattedCaptainTeams,
        memberTeams: uniqueMemberTeams,
      });
    }

    return NextResponse.json({
      teams: formattedCaptainTeams,
    });
  } catch (error) {
    console.error("Error fetching user teams:", error);
    return NextResponse.json(
      { error: "Failed to fetch teams" },
      { status: 500 }
    );
  }
}
