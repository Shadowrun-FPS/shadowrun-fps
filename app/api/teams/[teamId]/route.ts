import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId, Document, WithId } from "mongodb";
import { authOptions } from "@/lib/auth";
import { Session } from "next-auth";
import { connectToDatabase } from "@/lib/mongodb";
import { containsProfanity } from "@/lib/profanity-filter";
import { recalculateTeamElo } from "@/lib/team-elo-calculator";

interface TeamMember {
  discordId: string;
  role: string;
}

interface Team extends WithId<Document> {
  _id: ObjectId;
  name: string;
  captain: {
    discordId: string;
  };
  members: TeamMember[];
}

// Get team details
export async function GET(
  request: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const { teamId } = params;
    const { db } = await connectToDatabase();

    // Try to find by ObjectId first
    let team;
    try {
      if (ObjectId.isValid(teamId)) {
        team = await db
          .collection("Teams")
          .findOne({ _id: new ObjectId(teamId) });
      }
    } catch (error) {
      console.error("Error finding team by ID:", error);
    }

    // If not found by ID, try to find by tag
    if (!team) {
      team = await db.collection("Teams").findOne({ tag: teamId });
    }

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Automatically recalculate team ELO based on current member ELOs
    // This ensures team ELO is always up-to-date when the page loads
    if (team.members && team.members.length > 0) {
      try {
        const updatedElo = await recalculateTeamElo(team._id.toString());
        // Update team object with fresh ELO
        team.teamElo = updatedElo;
      } catch (error) {
        // Silently fail - don't block team data if ELO calculation fails
        console.error("Failed to auto-calculate team ELO:", error);
      }
    }

    // Convert ObjectId to string for JSON serialization
    const teamWithStringId = {
      ...team,
      _id: team._id.toString(),
    };

    return NextResponse.json(teamWithStringId);
  } catch (error) {
    console.error("Error fetching team:", error);
    return NextResponse.json(
      { error: "Failed to load team data" },
      { status: 500 }
    );
  }
}

// Update team details
export async function PATCH(
  req: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const { name, tag, description } = await req.json();
    const client = await clientPromise;
    const db = client.db("ShadowrunWeb");

    // Check for profanity in team name, tag, and description
    if (name && containsProfanity(name)) {
      return NextResponse.json(
        { error: "Team name contains inappropriate language. Please choose a different name." },
        { status: 400 }
      );
    }

    if (tag && containsProfanity(tag)) {
      return NextResponse.json(
        { error: "Team tag contains inappropriate language. Please choose a different tag." },
        { status: 400 }
      );
    }

    if (description && containsProfanity(description)) {
      return NextResponse.json(
        { error: "Team description contains inappropriate language. Please revise your description." },
        { status: 400 }
      );
    }

    // Check if name/tag is already taken by another team
    const existingTeam = await db.collection("Teams").findOne({
      _id: { $ne: new ObjectId(params.teamId) },
      $or: [
        { name: { $regex: new RegExp(`^${name}$`, "i") } },
        { tag: { $regex: new RegExp(`^${tag}$`, "i") } },
      ],
    });

    if (existingTeam) {
      return NextResponse.json(
        { error: "Team name or tag already exists" },
        { status: 400 }
      );
    }

    const result = await db.collection<Team>("Teams").findOneAndUpdate(
      { _id: new ObjectId(params.teamId) },
      {
        $set: {
          name,
          tag: tag.toUpperCase(),
          description,
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after" }
    );

    if (!result || !result.value) {
      return NextResponse.json(
        { error: "Failed to update team" },
        { status: 400 }
      );
    }

    // Convert ObjectId to string before sending response
    const team = {
      ...result.value,
      _id: result.value._id.toString(),
    };

    return NextResponse.json(team);
  } catch (error) {
    console.error("Failed to update team:", error);
    return NextResponse.json(
      { error: "Failed to update team" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const { name } = await req.json();
    const client = await clientPromise;
    const db = client.db("ShadowrunWeb");

    const result = await db.collection<Team>("Teams").findOneAndUpdate(
      { _id: new ObjectId(params.teamId) },
      {
        $set: {
          name,
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after" }
    );

    if (!result || !result.value) {
      return NextResponse.json(
        { error: "Failed to update team" },
        { status: 400 }
      );
    }

    // Convert ObjectId to string before sending response
    const team = {
      ...result.value,
      _id: result.value._id.toString(),
    };

    return NextResponse.json(team);
  } catch (error) {
    console.error("Failed to update team:", error);
    return NextResponse.json(
      { error: "Failed to update team" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db("ShadowrunWeb");

    const result = await db.collection<Team>("Teams").findOneAndDelete({
      _id: new ObjectId(params.teamId),
      "captain.discordId": session.user.id,
    });

    if (!result || !result.value) {
      return NextResponse.json(
        { error: "Failed to delete team" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete team:", error);
    return NextResponse.json(
      { error: "Failed to delete team" },
      { status: 500 }
    );
  }
}
