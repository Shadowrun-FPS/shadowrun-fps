import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId, Document, WithId } from "mongodb";

interface TeamMember {
  discordId: string;
  role: string;
}

interface Team extends WithId<Document> {
  _id: ObjectId;
  name: string;
  members: TeamMember[];
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const { memberId, role } = await req.json();
    const client = await clientPromise;
    const db = client.db("ShadowrunWeb");

    const result = await db.collection<Team>("Teams").findOneAndUpdate(
      {
        _id: new ObjectId(params.teamId),
        "members.discordId": memberId,
      },
      {
        $set: {
          "members.$.role": role,
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after" }
    );

    if (!result || !result.value) {
      return NextResponse.json(
        { error: "Failed to update member role" },
        { status: 400 }
      );
    }

    return NextResponse.json(result.value);
  } catch (error) {
    console.error("Failed to update member role:", error);
    return NextResponse.json(
      { error: "Failed to update member role" },
      { status: 500 }
    );
  }
}
