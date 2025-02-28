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

interface TeamMember {
  discordId: string;
  discordUsername: string;
  discordNickname: string;
  role: string;
  joinedAt: Date;
}

interface Team extends WithId<Document> {
  _id: ObjectId;
  name: string;
  members: TeamMember[];
}

interface Player extends WithId<Document> {
  discordId: string;
  discordUsername: string;
  discordNickname: string;
}

export async function POST(
  req: NextRequest,
  { params }: { params: { inviteId: string } }
) {
  try {
    const { accept } = await req.json();
    const client = await clientPromise;
    const db = client.db("ShadowrunWeb");

    // Get invite
    const invite = await db.collection<TeamInvite>("TeamInvites").findOne({
      _id: new ObjectId(params.inviteId),
      status: "pending",
    });

    if (!invite) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    }

    // Get player details
    const player = await db.collection<Player>("Players").findOne({
      discordId: invite.inviteeId,
    });

    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    if (accept) {
      // Add player to team
      const result = await db.collection<Team>("Teams").findOneAndUpdate(
        { _id: invite.teamId },
        {
          $push: {
            members: {
              discordId: player.discordId,
              discordUsername: player.discordUsername,
              discordNickname: player.discordNickname,
              role: "member",
              joinedAt: new Date(),
            },
          } as any, // Type assertion needed due to MongoDB types limitation
        },
        { returnDocument: "after" }
      );

      if (!result || !result.value) {
        return NextResponse.json(
          { error: "Failed to add member to team" },
          { status: 400 }
        );
      }
    }

    // Update invite status
    await db.collection("TeamInvites").updateOne(
      { _id: new ObjectId(params.inviteId) },
      {
        $set: {
          status: accept ? "accepted" : "declined",
          respondedAt: new Date(),
        },
      }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to respond to invite:", error);
    return NextResponse.json(
      { error: "Failed to respond to invite" },
      { status: 500 }
    );
  }
}
