import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId, Document, WithId } from "mongodb";
import { authOptions } from "@/lib/auth";

interface TeamInvite extends WithId<Document> {
  _id: ObjectId;
  teamId: ObjectId;
  inviteeId: string;
  status: string;
}

interface Team extends WithId<Document> {
  _id: ObjectId;
  name: string;
  members: Array<{
    discordId: string;
    role: string;
  }>;
}

export async function POST(
  req: NextRequest,
  { params }: { params: { inviteId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db("ShadowrunWeb");

    // Find and update invite status
    const invite = await db.collection<TeamInvite>("TeamInvites").findOne({
      _id: new ObjectId(params.inviteId),
      inviteeId: session.user.id,
      status: "pending",
    });

    if (!invite) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    }

    const team = await db.collection<Team>("Teams").findOne({
      _id: invite.teamId,
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Add member to team
    const result = await db.collection<Team>("Teams").findOneAndUpdate(
      { _id: invite.teamId },
      {
        $addToSet: {
          members: {
            discordId: session.user.id,
            role: "member",
          },
        } as any,
      },
      { returnDocument: "after" }
    );

    if (!result || !result.value) {
      return NextResponse.json(
        { error: "Failed to join team" },
        { status: 400 }
      );
    }

    // Update invite status
    await db.collection("TeamInvites").updateOne(
      { _id: new ObjectId(params.inviteId) },
      {
        $set: {
          status: "accepted",
          acceptedAt: new Date(),
        },
      }
    );

    return NextResponse.json(result.value);
  } catch (error) {
    console.error("Failed to accept team invite:", error);
    return NextResponse.json(
      { error: "Failed to accept team invite" },
      { status: 500 }
    );
  }
}
