import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId, Document, WithId } from "mongodb";
import { recalculateTeamElo } from "@/lib/team-elo-calculator";
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity, validateBody } from "@/lib/api-wrapper";
import { revalidatePath } from "next/cache";

interface TeamMember {
  discordId: string;
  role: string;
}

interface Team extends WithId<Document> {
  _id: ObjectId;
  name: string;
  members: TeamMember[];
}

async function putTeamRoleHandler(
  req: NextRequest,
  { params }: { params: { teamId: string } }
) {
  const teamId = sanitizeString(params.teamId, 50);
  if (!ObjectId.isValid(teamId)) {
    return NextResponse.json(
      { error: "Invalid team ID" },
      { status: 400 }
    );
  }

  const body = await req.json();
  const validation = validateBody(body, {
    memberId: { type: "string", required: true, maxLength: 50 },
    role: { type: "string", required: true, maxLength: 50 },
  });

  if (!validation.valid) {
    return NextResponse.json(
      { error: validation.errors?.join(", ") || "Invalid input" },
      { status: 400 }
    );
  }

  const { memberId, role } = validation.data! as {
    memberId: string;
    role: string;
  };

  const sanitizedMemberId = sanitizeString(memberId, 50);
  const sanitizedRole = sanitizeString(role, 50);

  const client = await clientPromise;
  const db = client.db("ShadowrunWeb");

  const result = await db.collection<Team>("Teams").findOneAndUpdate(
    {
      _id: new ObjectId(teamId),
      "members.discordId": sanitizedMemberId,
    },
    {
      $set: {
        "members.$.role": sanitizedRole,
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

  await recalculateTeamElo(teamId);

  revalidatePath("/teams");
  revalidatePath(`/teams/${teamId}`);

  return NextResponse.json(result.value);
}

export const PUT = withApiSecurity(putTeamRoleHandler, {
  rateLimiter: "api",
  requireAuth: true,
  revalidatePaths: ["/teams"],
});
