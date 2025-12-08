import { NextRequest, NextResponse } from "next/server";
import { ObjectId, Document, WithId } from "mongodb";
import {
  updateTeamElo,
  isTeamCaptain,
  updateTeamMember,
} from "@/lib/team-helpers";
import clientPromise from "@/lib/mongodb";
import { recalculateTeamElo } from "@/lib/team-elo-calculator";
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity } from "@/lib/api-wrapper";
import { revalidatePath } from "next/cache";

interface TeamMember {
  discordId: string;
  role?: string;
}

interface Team extends WithId<Document> {
  _id: ObjectId;
  name: string;
  members: TeamMember[];
}

async function deleteTeamMemberHandler(
  req: NextRequest,
  { params }: { params: { teamId: string; memberId: string } }
) {
  const teamId = sanitizeString(params.teamId, 50);
  const memberId = sanitizeString(params.memberId, 50);

  if (!ObjectId.isValid(teamId)) {
    return NextResponse.json(
      { error: "Invalid team ID" },
      { status: 400 }
    );
  }

  const client = await clientPromise;
  const db = client.db("ShadowrunWeb");

  const result = await db
    .collection<Team>("Teams")
    .findOneAndUpdate(
      { _id: new ObjectId(teamId) },
      { $pull: { members: { discordId: memberId } } as any },
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

  const updatedElo = await recalculateTeamElo(teamId);

  revalidatePath("/teams");
  revalidatePath(`/teams/${teamId}`);

  return NextResponse.json({
    success: true,
    message: "Member removed",
    teamElo: updatedElo,
  });
}

export const DELETE = withApiSecurity(deleteTeamMemberHandler, {
  rateLimiter: "api",
  requireAuth: true,
  revalidatePaths: ["/teams"],
});
