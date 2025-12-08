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

async function putTeamMemberRoleHandler(
  req: NextRequest,
  { params }: { params: { teamId: string; memberId: string } }
) {
  const session = (await getServerSession(
    authOptions
  )) as DiscordSession | null;
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const teamId = sanitizeString(params.teamId, 50);
  const memberId = sanitizeString(params.memberId, 50);

  if (!ObjectId.isValid(teamId)) {
    return NextResponse.json(
      { error: "Invalid team ID" },
      { status: 400 }
    );
  }

  const body = await req.json();
  const validation = validateBody(body, {
    role: {
      type: "string",
      required: true,
      pattern: /^(member|captain|admin)$/,
    },
  });

  if (!validation.valid) {
    return NextResponse.json(
      { error: validation.errors?.join(", ") || "Invalid input" },
      { status: 400 }
    );
  }

  const { role } = validation.data! as { role: string };
  const sanitizedRole = sanitizeString(role, 20);

  const client = await clientPromise;
  const db = client.db("ShadowrunWeb");

  const result = await db.collection<Team>("Teams").findOneAndUpdate(
    {
      _id: new ObjectId(teamId),
      "members.discordId": memberId,
    },
    {
      $set: { "members.$.role": sanitizedRole } as any,
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

export const PUT = withApiSecurity(putTeamMemberRoleHandler, {
  rateLimiter: "api",
  requireAuth: true,
  revalidatePaths: ["/teams"],
});
