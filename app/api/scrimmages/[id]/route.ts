import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { SECURITY_CONFIG } from "@/lib/security-config";

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

    // Try to find the scrimmage by _id first, then by scrimmageId field
    let scrimmage = null;
    
    // Try by ObjectId first
    if (ObjectId.isValid(scrimmageId)) {
      try {
        scrimmage = await db.collection("Scrimmages").findOne({
          _id: new ObjectId(scrimmageId),
        });
      } catch (error) {
        // Invalid ObjectId format, continue to next method
      }
    }

    // If not found, try by scrimmageId field
    if (!scrimmage) {
      scrimmage = await db.collection("Scrimmages").findOne({
        scrimmageId: scrimmageId,
      });
    }

    // Last resort: try to find a recently created scrimmage for this user (within last 5 minutes)
    if (!scrimmage && session.user.id) {
      const userTeams = await db
        .collection("Teams")
        .find({
          "members.discordId": session.user.id,
        })
        .toArray();

      const teamIds = userTeams.map((team) => team._id.toString());

      if (teamIds.length > 0) {
        scrimmage = await db.collection("Scrimmages").findOne(
          {
            $or: [
              { challengerTeamId: { $in: teamIds } },
              { challengedTeamId: { $in: teamIds } },
            ],
            createdAt: { $gte: new Date(Date.now() - 5 * 60 * 1000) },
          },
          { sort: { createdAt: -1 } }
        );
      }
    }

    if (!scrimmage) {
      return NextResponse.json(
        { error: "Scrimmage not found" },
        { status: 404 }
      );
    }

    // Ensure the teams are properly populated
    if (!scrimmage.challengerTeam || !scrimmage.challengedTeam) {
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
        // Continue with the incomplete scrimmage data rather than failing
      }
    }

    return NextResponse.json(scrimmage);
  } catch (error) {
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

    const isAdmin = session.user.roles?.includes("admin");
    const isSpecificUser = session.user.id === SECURITY_CONFIG.DEVELOPER_ID;

    if (!isAdmin && !isSpecificUser) {
      return NextResponse.json(
        { error: "You are not authorized to delete scrimmages" },
        { status: 403 }
      );
    }

    const { db } = await connectToDatabase();
    const scrimmageId = params.id;

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
    return NextResponse.json(
      { error: "Failed to delete scrimmage" },
      { status: 500 }
    );
  }
}
