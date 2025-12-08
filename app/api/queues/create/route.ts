import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { v4 as uuidv4 } from "uuid";
import { SECURITY_CONFIG } from "@/lib/security-config";
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity, validateBody } from "@/lib/api-wrapper";
import { revalidatePath } from "next/cache";

async function postCreateHandler(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json(
      { error: "You must be signed in to create a queue" },
      { status: 401 }
    );
  }

  const isAdmin =
    session.user.id === SECURITY_CONFIG.DEVELOPER_ID || session.user.isAdmin;

  if (!isAdmin) {
    return NextResponse.json(
      { error: "You don't have permission to create queues" },
      { status: 403 }
    );
  }

  const { db } = await connectToDatabase();
  const data = await req.json();

  const validation = validateBody(data, {
    teamSize: { type: "number", required: true, min: 1, max: 8 },
    eloTier: { type: "string", required: true, maxLength: 50 },
    minElo: { type: "number", required: true, min: 0, max: 10000 },
    maxElo: { type: "number", required: true, min: 0, max: 10000 },
    gameType: { type: "string", required: false, maxLength: 50 },
    status: { type: "string", required: false, maxLength: 50 },
  });

  if (!validation.valid) {
    return NextResponse.json(
      { error: validation.errors?.join(", ") || "Invalid input" },
      { status: 400 }
    );
  }

  const { teamSize, eloTier, minElo, maxElo, gameType, status } = validation.data! as {
    teamSize: number;
    eloTier: string;
    minElo: number;
    maxElo: number;
    gameType?: string;
    status?: string;
  };

  if (minElo >= maxElo) {
    return NextResponse.json(
      { error: "Min ELO must be less than Max ELO" },
      { status: 400 }
    );
  }

    // Fetch all ranked maps to set as default mapPool
    const rankedMaps = await db
      .collection("Maps")
      .find({ rankedMap: true })
      .toArray();

    // Create default mapPool with all ranked maps (normal variants, and small variants if available)
    const defaultMapPool: any[] = [];
    for (const map of rankedMaps) {
      // Add normal variant
      defaultMapPool.push({
        _id: map._id.toString(),
        name: map.name,
        src: map.src,
        gameMode: map.gameMode,
        isSmall: false,
      });

      // Add small variant if available
      if (map.smallOption) {
        defaultMapPool.push({
          _id: map._id.toString(),
          name: `${map.name} (Small)`,
          src: map.src,
          gameMode: map.gameMode,
          isSmall: true,
        });
      }
    }

    const queueData = {
      queueId: uuidv4(),
      gameType: sanitizeString(gameType || "ranked", 50),
      teamSize,
      players: [],
      eloTier: sanitizeString(eloTier, 50),
      minElo,
      maxElo,
      status: sanitizeString(status || "active", 50),
      mapPool: defaultMapPool,
      createdAt: new Date(),
      createdBy: {
        discordId: session.user.id,
        discordNickname: sanitizeString(session.user.name || "Unknown", 100),
      },
    };

    const result = await db.collection("Queues").insertOne(queueData);

    // Emit event to notify clients about the new queue
    // This would typically be handled by your real-time system

    revalidatePath("/matches/queues");
    revalidatePath("/admin/queues");

    return NextResponse.json(
      { success: true, queueId: queueData.queueId, _id: result.insertedId },
      { status: 201 }
    );
}

export const POST = withApiSecurity(postCreateHandler, {
  rateLimiter: "admin",
  requireAuth: true,
  requireAdmin: true,
  revalidatePaths: ["/matches/queues", "/admin/queues"],
});
