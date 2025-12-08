import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId, Document, WithId } from "mongodb";
import { authOptions } from "@/lib/auth";
import { Session } from "next-auth";
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
  captain: {
    discordId: string;
  };
  members: TeamMember[];
}

async function deleteTeamMemberHandler(
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
    requesterId: { type: "string", required: true, maxLength: 50 },
  });

  if (!validation.valid) {
    return NextResponse.json(
      { error: validation.errors?.join(", ") || "Invalid input" },
      { status: 400 }
    );
  }

  const { memberId, requesterId } = validation.data! as {
    memberId: string;
    requesterId: string;
  };

  const sanitizedMemberId = sanitizeString(memberId, 50);
  const sanitizedRequesterId = sanitizeString(requesterId, 50);

  const client = await clientPromise;
  const db = client.db("ShadowrunWeb");

  const team = await db.collection<Team>("Teams").findOne({
    _id: new ObjectId(teamId),
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

    await db.collection<Team>("Teams").updateOne(
      { _id: new ObjectId(teamId) },
      {
        $pull: { members: { discordId: sanitizedMemberId } } as any,
        $set: { updatedAt: new Date() },
      }
    );

    await recalculateTeamElo(teamId);

    revalidatePath("/teams");
    revalidatePath(`/teams/${teamId}`);

    return NextResponse.json({ success: true });
}

export const DELETE = withApiSecurity(deleteTeamMemberHandler, {
  rateLimiter: "api",
  requireAuth: true,
  revalidatePaths: ["/teams"],
});

async function postTeamMemberHandler(
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
    requesterId: { type: "string", required: true, maxLength: 50 },
  });

  if (!validation.valid) {
    return NextResponse.json(
      { error: validation.errors?.join(", ") || "Invalid input" },
      { status: 400 }
    );
  }

  const { memberId, requesterId } = validation.data! as {
    memberId: string;
    requesterId: string;
  };

  const sanitizedMemberId = sanitizeString(memberId, 50);
  const sanitizedRequesterId = sanitizeString(requesterId, 50);

  const client = await clientPromise;
  const db = client.db("ShadowrunWeb");

  const team = await db.collection<Team>("Teams").findOne({
    _id: new ObjectId(teamId),
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

    const result = await db.collection<Team>("Teams").findOneAndUpdate(
      { _id: new ObjectId(teamId) },
      {
        $addToSet: {
          members: {
            discordId: sanitizedMemberId,
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

    await recalculateTeamElo(teamId);

    revalidatePath("/teams");
    revalidatePath(`/teams/${teamId}`);

    return NextResponse.json(result.value);
}

export const POST = withApiSecurity(postTeamMemberHandler, {
  rateLimiter: "api",
  requireAuth: true,
  revalidatePaths: ["/teams"],
});
