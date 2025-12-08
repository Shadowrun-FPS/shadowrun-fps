import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import clientPromise from "@/lib/mongodb";
import { authOptions } from "@/lib/auth";
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity } from "@/lib/api-wrapper";
import { revalidatePath } from "next/cache";

// Add this line to explicitly mark the route as dynamic
export const dynamic = "force-dynamic";

async function postRegisterPlayerHandler(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json(
      { error: "You must be signed in to register" },
      { status: 401 }
    );
  }

  const client = await clientPromise;
  const db = client.db("ShadowrunWeb");

  const existingPlayer = await db.collection("Players").findOne({
    discordId: session.user.id,
  });

  if (existingPlayer) {
    return NextResponse.json(
      { error: "You are already registered" },
      { status: 400 }
    );
  }

  const teamSizes = [1, 2, 4, 5];
  const stats = teamSizes.map((teamSize) => ({
    teamSize,
    elo: 800,
    wins: 0,
    losses: 0,
  }));

  const playerDoc = {
    discordId: session.user.id,
    discordUsername: sanitizeString(session.user.name || "", 100),
    discordNickname: sanitizeString(session.user.nickname || "", 100),
    discordProfilePicture: session.user.image || null,
    stats,
    registeredAt: Date.now(),
  };

  await db.collection("Players").insertOne(playerDoc);

  revalidatePath("/players");
  revalidatePath(`/players/${session.user.id}`);

  return NextResponse.json({
    success: true,
    message: "Successfully registered for ranked matchmaking",
  });
}

export const POST = withApiSecurity(postRegisterPlayerHandler, {
  rateLimiter: "api",
  requireAuth: true,
  revalidatePaths: ["/players"],
});
