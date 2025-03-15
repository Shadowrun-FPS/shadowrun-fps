import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId, Document, WithId } from "mongodb";
import { authOptions } from "@/lib/auth";
import { Session } from "next-auth";

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
  req: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    // Validate teamId is a valid ObjectId
    if (!ObjectId.isValid(params.teamId)) {
      return NextResponse.json({ error: "Invalid team ID" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("ShadowrunWeb");

    const team = await db.collection("Teams").findOne({
      _id: new ObjectId(params.teamId),
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    console.log("Team data being returned:", JSON.stringify(team, null, 2));
    const session = await getServerSession(authOptions);
    console.log("Current user ID:", session?.user?.id);
    console.log(
      "Team members:",
      team.members.map((m: { discordId: any; role: any }) => ({
        id: m.discordId,
        role: m.role,
      }))
    );

    return NextResponse.json(team);
  } catch (error) {
    console.error("Failed to fetch team:", error);
    return NextResponse.json(
      { error: "Failed to fetch team" },
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
