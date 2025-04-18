import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId, Document, WithId } from "mongodb";
import { authOptions } from "@/lib/auth";
import { Session } from "next-auth";
import { recalculateTeamElo } from "@/lib/team-elo-calculator";

interface TeamMember {
  discordId: string;
  role: string;
}

interface Team extends WithId<Document> {
  _id: ObjectId;
  captain: {
    discordId: string;
  };
  members: TeamMember[];
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const { memberId, requesterId } = await req.json();
    const client = await clientPromise;
    const db = client.db("ShadowrunWeb");

    // Check if requester is captain or member removing themselves
    const team = await db.collection<Team>("Teams").findOne({
      _id: new ObjectId(params.teamId),
      $or: [
        { "captain.discordId": requesterId },
        {
          members: {
            $elemMatch: {
              discordId: { $in: [memberId, requesterId] },
            },
          },
        },
      ],
    });

    if (!team) {
      return NextResponse.json(
        { error: "Not authorized to remove member" },
        { status: 403 }
      );
    }

    // Remove member
    await db.collection<Team>("Teams").updateOne(
      { _id: new ObjectId(params.teamId) },
      {
        $pull: { members: { discordId: memberId } } as any,
        $set: { updatedAt: new Date() },
      }
    );

    // Recalculate team ELO using the shared function
    await recalculateTeamElo(params.teamId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to remove team member:", error);
    return NextResponse.json(
      { error: "Failed to remove member" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const { memberId, requesterId } = await req.json();
    const client = await clientPromise;
    const db = client.db("ShadowrunWeb");

    // Verify requester has permission (is captain or the member being added)
    const team = await db.collection<Team>("Teams").findOne({
      _id: new ObjectId(params.teamId),
      $or: [
        { "captain.discordId": requesterId },
        {
          members: {
            $elemMatch: {
              discordId: { $in: [memberId, requesterId] },
            },
          },
        },
      ],
    });

    if (!team) {
      return NextResponse.json(
        { error: "Not authorized to add members" },
        { status: 403 }
      );
    }

    // Add member to team
    const result = await db.collection<Team>("Teams").findOneAndUpdate(
      { _id: new ObjectId(params.teamId) },
      {
        $addToSet: {
          members: {
            discordId: memberId,
            role: "member",
          },
        } as any,
      },
      { returnDocument: "after" }
    );

    if (!result || !result.value) {
      return NextResponse.json(
        { error: "Failed to add member" },
        { status: 400 }
      );
    }

    // Recalculate team ELO after adding a member
    await recalculateTeamElo(params.teamId);

    return NextResponse.json(result.value);
  } catch (error) {
    console.error("Failed to add team member:", error);
    return NextResponse.json(
      { error: "Failed to add team member" },
      { status: 500 }
    );
  }
}
