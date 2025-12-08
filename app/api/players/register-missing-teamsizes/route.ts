import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import clientPromise from "@/lib/mongodb";
import { authOptions } from "@/lib/auth";
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity } from "@/lib/api-wrapper";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

async function postRegisterMissingTeamSizesHandler(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json(
      { error: "You must be signed in to register" },
      { status: 401 }
    );
  }

  const userId = sanitizeString(session.user.id, 50);
  const client = await clientPromise;
  const db = client.db("ShadowrunWeb");

  const player = await db.collection("Players").findOne({
    discordId: userId,
  });

    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    // All team sizes that should exist
    const allTeamSizes = [1, 2, 4, 5];

    // Get the team sizes the player already has
    const existingTeamSizes = player.stats.map((stat: any) => stat.teamSize);

    // Find missing team sizes
    const missingTeamSizes = allTeamSizes.filter(
      (size) => !existingTeamSizes.includes(size)
    );

    if (missingTeamSizes.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No missing team sizes to register",
      });
    }

    // Find the 4v4 stats to copy ELO from
    const elo4v4 =
      player.stats.find((stat: any) => stat.teamSize === 4)?.elo || 800;

    // Create new stats objects for missing team sizes
    const newStats = missingTeamSizes.map((teamSize) => ({
      teamSize,
      elo: elo4v4, // Copy ELO from 4v4 or use default 800
      wins: 0,
      losses: 0,
    }));

    await db
      .collection("Players")
      .updateOne({ discordId: userId }, {
        $push: { stats: { $each: newStats } },
      } as any);

    revalidatePath("/players");
    revalidatePath(`/players/${userId}`);

    return NextResponse.json({
      success: true,
      message: "Successfully registered for missing team sizes",
      registeredSizes: missingTeamSizes,
    });
}

export const POST = withApiSecurity(postRegisterMissingTeamSizesHandler, {
  rateLimiter: "api",
  requireAuth: true,
  revalidatePaths: ["/players"],
});
