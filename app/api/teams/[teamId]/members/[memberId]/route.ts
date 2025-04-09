import { NextRequest, NextResponse } from "next/server";
import { ObjectId, Document, WithId } from "mongodb";
import {
  updateTeamElo,
  isTeamCaptain,
  updateTeamMember,
} from "@/lib/team-helpers";
import clientPromise from "@/lib/mongodb";
import { recalculateTeamElo } from "@/lib/team-elo-calculator";

interface TeamMember {
  discordId: string;
  role?: string;
}

interface Team extends WithId<Document> {
  _id: ObjectId;
  name: string;
  members: TeamMember[];
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { teamId: string; memberId: string } }
) {
  try {
    const client = await clientPromise;
    const db = client.db("ShadowrunWeb");

    const result = await db
      .collection<Team>("Teams")
      .findOneAndUpdate(
        { _id: new ObjectId(params.teamId) },
        { $pull: { members: { discordId: params.memberId } } as any },
        { returnDocument: "after" }
      );

    if (!result) {
      return NextResponse.json(
        { error: "Failed to remove member" },
        { status: 500 }
      );
    }

    const team = result.value;
    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // After removing member, update team ELO
    const updatedElo = await recalculateTeamElo(params.teamId);

    return NextResponse.json({
      success: true,
      message: "Member removed",
      teamElo: updatedElo,
    });
  } catch (error) {
    console.error("Failed to remove team member:", error);
    return NextResponse.json(
      { error: "Failed to remove team member" },
      { status: 500 }
    );
  }
}
