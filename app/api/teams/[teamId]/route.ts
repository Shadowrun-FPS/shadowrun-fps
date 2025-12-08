import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId, Document, WithId } from "mongodb";
import { authOptions } from "@/lib/auth";
import { Session } from "next-auth";
import { connectToDatabase } from "@/lib/mongodb";
import { containsProfanity } from "@/lib/profanity-filter";
import { recalculateTeamElo } from "@/lib/team-elo-calculator";
import { getAllTeamCollectionNames, getTeamCollectionName } from "@/lib/team-collections";
import { safeLog, sanitizeString } from "@/lib/security";
import { cachedQuery } from "@/lib/query-cache";
import { withApiSecurity, validateBody } from "@/lib/api-wrapper";
import { revalidatePath } from "next/cache";

interface TeamMember {
  discordId: string;
  role: string;
}

interface Team extends WithId<Document> {
  _id: ObjectId;
  name: string;
  captain: {
    discordId: string;
  };
  members: TeamMember[];
}

async function getTeamHandler(
  request: NextRequest,
  { params }: { params: { teamId: string } }
) {
  const teamId = sanitizeString(params.teamId, 50);
  const { db } = await connectToDatabase();

  const result = await cachedQuery(
    `team:${teamId}`,
    async () => {
      const allCollections = getAllTeamCollectionNames();
      let team = null;

      if (ObjectId.isValid(teamId)) {
        for (const collectionName of allCollections) {
          try {
            team = await db
              .collection(collectionName)
              .findOne({ _id: new ObjectId(teamId) });
            if (team) break;
          } catch (error) {
            // Continue to next collection
          }
        }
      }

      if (!team) {
        for (const collectionName of allCollections) {
          team = await db.collection(collectionName).findOne({ tag: teamId });
          if (team) break;
        }
      }

      if (!team) {
        return null;
      }

      if (team.members && team.members.length > 0) {
        try {
          const updatedElo = await recalculateTeamElo(team._id.toString());
          team.teamElo = updatedElo;
        } catch (error) {
          safeLog.error("Failed to auto-calculate team ELO:", error);
        }
      }

      return {
        ...team,
        _id: team._id.toString(),
      };
    },
    60 * 1000 // Cache for 1 minute
  );

  if (!result) {
    return NextResponse.json({ error: "Team not found" }, { status: 404 });
  }

  return NextResponse.json(result, {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
    },
  });
}

export const GET = withApiSecurity(getTeamHandler, {
  rateLimiter: "api",
  cacheable: true,
  cacheMaxAge: 60,
});

async function patchTeamHandler(
  req: NextRequest,
  { params }: { params: { teamId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const teamId = sanitizeString(params.teamId, 50);
  if (!ObjectId.isValid(teamId)) {
    return NextResponse.json(
      { error: "Invalid team ID format" },
      { status: 400 }
    );
  }

  const body = await req.json();
  const validation = validateBody(body, {
    name: { type: "string", required: false, maxLength: 50 },
    tag: { type: "string", required: false, maxLength: 10 },
    description: { type: "string", required: false, maxLength: 200 },
  });

  if (!validation.valid) {
    return NextResponse.json(
      { error: validation.errors?.join(", ") || "Invalid input" },
      { status: 400 }
    );
  }

  const validationData = validation.data! as {
    name?: string;
    tag?: string;
    description?: string;
  };
  const { name, tag, description } = validationData;
  const client = await clientPromise;
  const db = client.db("ShadowrunWeb");

  if (name && typeof name === "string" && containsProfanity(name)) {
    return NextResponse.json(
      { error: "Team name contains inappropriate language" },
      { status: 400 }
    );
  }

  if (tag && typeof tag === "string" && containsProfanity(tag)) {
    return NextResponse.json(
      { error: "Team tag contains inappropriate language" },
      { status: 400 }
    );
  }

  if (description && containsProfanity(description)) {
    return NextResponse.json(
      { error: "Team description contains inappropriate language" },
      { status: 400 }
    );
  }

  const allCollections = getAllTeamCollectionNames();
  let teamCollection = null;
  let existingTeam = null;

  for (const collectionName of allCollections) {
    existingTeam = await db.collection(collectionName).findOne({
      _id: new ObjectId(teamId),
    });
    if (existingTeam) {
      teamCollection = collectionName;
      break;
    }
  }

  if (!existingTeam || !teamCollection) {
    return NextResponse.json(
      { error: "Team not found" },
      { status: 404 }
    );
  }

  if (name || tag) {
    for (const collectionName of allCollections) {
      const conflictingTeam = await db.collection(collectionName).findOne({
        _id: { $ne: new ObjectId(teamId) },
        $or: [
          name ? { name: { $regex: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") } } : {},
          tag ? { tag: { $regex: new RegExp(`^${tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") } } : {},
        ].filter((obj) => Object.keys(obj).length > 0),
      });

      if (conflictingTeam) {
        return NextResponse.json(
          { error: "Team name or tag already exists" },
          { status: 400 }
        );
      }
    }
  }

  const updateData: any = { updatedAt: new Date() };
  if (name) updateData.name = sanitizeString(name, 50);
  if (tag) updateData.tag = sanitizeString(tag, 10).toUpperCase();
  if (description !== undefined) updateData.description = description ? sanitizeString(description, 200) : "";

  const result = await db.collection<Team>(teamCollection).findOneAndUpdate(
    { _id: new ObjectId(teamId) },
    { $set: updateData },
    { returnDocument: "after" }
  );

  if (!result || !result.value) {
    return NextResponse.json(
      { error: "Failed to update team" },
      { status: 400 }
    );
  }

  revalidatePath(`/teams/${teamId}`);
  revalidatePath("/teams");

  return NextResponse.json({
    ...result.value,
    _id: result.value._id.toString(),
  });
}

async function putTeamHandler(
  req: NextRequest,
  { params }: { params: { teamId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const teamId = sanitizeString(params.teamId, 50);
  if (!ObjectId.isValid(teamId)) {
    return NextResponse.json(
      { error: "Invalid team ID format" },
      { status: 400 }
    );
  }

  const body = await req.json();
  const validation = validateBody(body, {
    name: { type: "string", required: true, maxLength: 50 },
  });

  if (!validation.valid) {
    return NextResponse.json(
      { error: validation.errors?.join(", ") || "Invalid input" },
      { status: 400 }
    );
  }

  const validationData = validation.data! as { name: string };
  const { name } = validationData;
  const client = await clientPromise;
  const db = client.db("ShadowrunWeb");

  if (containsProfanity(name)) {
    return NextResponse.json(
      { error: "Team name contains inappropriate language" },
      { status: 400 }
    );
  }

  const allCollections = getAllTeamCollectionNames();
  let teamCollection = null;

  for (const collectionName of allCollections) {
    const team = await db.collection(collectionName).findOne({
      _id: new ObjectId(teamId),
    });
    if (team) {
      teamCollection = collectionName;
      break;
    }
  }

  if (!teamCollection) {
    return NextResponse.json(
      { error: "Team not found" },
      { status: 404 }
    );
  }

  const result = await db.collection<Team>(teamCollection).findOneAndUpdate(
    { _id: new ObjectId(teamId) },
    {
      $set: {
        name: sanitizeString(name, 50),
        updatedAt: new Date(),
      },
    },
    { returnDocument: "after" }
  );

  if (!result || !result.value) {
    return NextResponse.json(
      { error: "Failed to update team" },
      { status: 400 }
    );
  }

  revalidatePath(`/teams/${teamId}`);
  revalidatePath("/teams");

  return NextResponse.json({
    ...result.value,
    _id: result.value._id.toString(),
  });
}

export const PUT = withApiSecurity(putTeamHandler, {
  rateLimiter: "api",
  requireAuth: true,
  revalidatePaths: ["/teams"],
});

async function deleteTeamHandler(
  req: NextRequest,
  { params }: { params: { teamId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const teamId = sanitizeString(params.teamId, 50);
  if (!ObjectId.isValid(teamId)) {
    return NextResponse.json(
      { error: "Invalid team ID format" },
      { status: 400 }
    );
  }

  const client = await clientPromise;
  const db = client.db("ShadowrunWeb");

  const allCollections = getAllTeamCollectionNames();
  let result = null;

  for (const collectionName of allCollections) {
    result = await db.collection<Team>(collectionName).findOneAndDelete({
      _id: new ObjectId(teamId),
      "captain.discordId": session.user.id,
    });
    if (result && result.value) break;
  }

  if (!result || !result.value) {
    return NextResponse.json(
      { error: "Team not found or you don't have permission to delete it" },
      { status: 403 }
    );
  }

  revalidatePath("/teams");
  revalidatePath(`/teams/${teamId}`);

  return NextResponse.json({ success: true });
}

export const DELETE = withApiSecurity(deleteTeamHandler, {
  rateLimiter: "api",
  requireAuth: true,
  revalidatePaths: ["/teams"],
});
