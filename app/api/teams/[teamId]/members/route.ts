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

    // Recalculate team ELO
    await updateTeamElo(db, params.teamId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to remove team member:", error);
    return NextResponse.json(
      { error: "Failed to remove member" },
      { status: 500 }
    );
  }
}

async function updateTeamElo(db: any, teamId: string) {
  const team = await db.collection("Teams").findOne({
    _id: new ObjectId(teamId),
  });

  // Get all member ELOs
  const memberIds = team.members.map((m: any) => m.discordId);
  const players = await db
    .collection("Players")
    .find({ discordId: { $in: memberIds } })
    .toArray();

  // Calculate weighted average ELO
  // Weights: Captain (1.2), Active players (1.0), Inactive players (0.8)
  let totalWeight = 0;
  let weightedEloSum = 0;

  for (const member of team.members) {
    const player = players.find((p: any) => p.discordId === member.discordId);
    if (!player) continue;

    let weight = 1.0;
    if (member.role === "captain") weight = 1.2;
    else if (member.role === "inactive") weight = 0.8;

    weightedEloSum += player.elo * weight;
    totalWeight += weight;
  }

  const newTeamElo = Math.round(weightedEloSum / totalWeight);

  // Update team ELO
  await db
    .collection("Teams")
    .updateOne({ _id: new ObjectId(teamId) }, { $set: { elo: newTeamElo } });

  return newTeamElo;
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

    return NextResponse.json(result.value);
  } catch (error) {
    console.error("Failed to add team member:", error);
    return NextResponse.json(
      { error: "Failed to add team member" },
      { status: 500 }
    );
  }
}
