export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { connectToDatabase } from "@/lib/mongodb";
import { SECURITY_CONFIG } from "@/lib/security-config";
import { safeLog, rateLimiters, getClientIdentifier } from "@/lib/security";
import { cachedQuery } from "@/lib/query-cache";
import { withApiSecurity, validateBody } from "@/lib/api-wrapper";
import { revalidatePath } from "next/cache";

async function getTournamentsHandler(request: NextRequest) {
  const client = await clientPromise;
  const db = client.db();

  const result = await cachedQuery(
    "tournaments:all",
    async () => {
      const tournaments = await db
        .collection("Tournaments")
        .find({})
        .sort({ startDate: -1 })
        .toArray();

      return tournaments.map((tournament) => ({
        ...tournament,
        _id: tournament._id.toString(),
      }));
    },
    2 * 60 * 1000 // Cache for 2 minutes
  );

  return NextResponse.json(result, {
    headers: {
      "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600",
    },
  });
}

export const GET = withApiSecurity(getTournamentsHandler, {
  rateLimiter: "api",
  cacheable: true,
  cacheMaxAge: 120,
});

async function postTournamentsHandler(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!session.user.isAdmin && session.user.id !== SECURITY_CONFIG.DEVELOPER_ID) {
    return NextResponse.json(
      { error: "Only administrators can create tournaments" },
      { status: 403 }
    );
  }

  const { db } = await connectToDatabase();
  const body = await request.json();

  const validation = validateBody(body, {
    name: { type: "string", required: true, maxLength: 200 },
    format: { type: "string", required: true },
    teamSize: { type: "number", required: true, min: 2, max: 5 },
    maxTeams: { type: "number", required: true, min: 2, max: 128 },
  });

  if (!validation.valid) {
    return NextResponse.json(
      { error: validation.errors?.join(", ") || "Invalid input" },
      { status: 400 }
    );
  }

  const data = validation.data!;

  const tournamentData = {
    ...data,
    status: "upcoming",
    createdAt: new Date(),
    createdBy: {
      userId: session.user.id,
      name: session.user.name,
    },
    teams: [],
    brackets: {
      rounds: [],
    },
    coHosts: body.coHosts || [],
  };

  if (data.format === "double_elimination") {
    (tournamentData.brackets as any).losersRounds = [];
  }

  const result = await db.collection("Tournaments").insertOne(tournamentData);

  revalidatePath("/tournaments");
  revalidatePath(`/tournaments/${result.insertedId.toString()}`);

  return NextResponse.json({
    success: true,
    tournamentId: result.insertedId,
    message: "Tournament created successfully",
  });
}

export const POST = withApiSecurity(postTournamentsHandler, {
  rateLimiter: "admin",
  requireAuth: true,
  requireAdmin: true,
  revalidatePaths: ["/tournaments"],
});

async function deleteTournamentsHandler(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const client = await clientPromise;
  const db = client.db();

  const user = await db.collection("Users").findOne({
    discordId: session.user.id,
  });

  const isAdmin = user?.roles?.includes("admin") || session.user.id === SECURITY_CONFIG.DEVELOPER_ID;

  if (!isAdmin) {
    return NextResponse.json(
      { error: "Only administrators can delete tournaments" },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id || !ObjectId.isValid(id)) {
    return NextResponse.json(
      { error: "Invalid tournament ID" },
      { status: 400 }
    );
  }

  const result = await db.collection("Tournaments").deleteOne({
    _id: new ObjectId(id),
  });

  if (result.deletedCount === 0) {
    return NextResponse.json(
      { error: "Tournament not found" },
      { status: 404 }
    );
  }

  revalidatePath("/tournaments");
  revalidatePath(`/tournaments/${id}`);

  return NextResponse.json({
    success: true,
    message: "Tournament successfully deleted",
  });
}

export const DELETE = withApiSecurity(deleteTournamentsHandler, {
  rateLimiter: "admin",
  requireAuth: true,
  requireAdmin: true,
  revalidatePaths: ["/tournaments"],
});
