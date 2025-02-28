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
  members: TeamMember[];
}

interface DiscordUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  nickname?: string | null;
}

interface DiscordSession extends Omit<Session, "user"> {
  user: DiscordUser;
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { teamId: string; memberId: string } }
) {
  try {
    const session = (await getServerSession(
      authOptions
    )) as DiscordSession | null;
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role } = await req.json();
    const client = await clientPromise;
    const db = client.db("ShadowrunWeb");

    const result = await db.collection<Team>("Teams").findOneAndUpdate(
      {
        _id: new ObjectId(params.teamId),
        "members.discordId": params.memberId,
      },
      {
        $set: { "members.$.role": role } as any,
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
