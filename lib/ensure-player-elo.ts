import clientPromise from "@/lib/mongodb";

const DEFAULT_ELO = 800;
const ALL_TEAM_SIZES = [1, 2, 3, 4, 5];

/**
 * Ensures a player has ELO records for all team sizes (1v1, 2v2, 3v3, 4v4, 5v5)
 * Priority for ELO value:
 * 1. Use 4v4 ELO if it exists
 * 2. Use highest existing ELO if no 4v4
 * 3. Use default 800 if no ELO exists
 * 
 * @param discordId The Discord ID of the player
 * @returns Promise<boolean> True if any records were created, false otherwise
 */
export async function ensurePlayerEloForAllTeamSizes(
  discordId: string
): Promise<boolean> {
  try {
    const client = await clientPromise;
    const db = client.db("ShadowrunWeb");

    // Get or create player
    let player = await db.collection("Players").findOne({
      discordId: discordId,
    });

    // If player doesn't exist, create a basic player record
    if (!player) {
      // We need basic player info - this should ideally come from session/user
      // For now, we'll create a minimal record
      const insertResult = await db.collection("Players").insertOne({
        discordId: discordId,
        stats: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      player = await db.collection("Players").findOne({
        _id: insertResult.insertedId,
      });
    }

    if (!player) {
      console.error(`Failed to create/find player: ${discordId}`);
      return false;
    }

    // Get existing team sizes
    const existingTeamSizes =
      (player.stats as any[])?.map((stat: any) => stat.teamSize) || [];

    // Find missing team sizes
    const missingTeamSizes = ALL_TEAM_SIZES.filter(
      (size) => !existingTeamSizes.includes(size)
    );

    // If no missing team sizes, nothing to do
    if (missingTeamSizes.length === 0) {
      return false;
    }

    // Determine ELO value to use based on priority
    let eloToUse = DEFAULT_ELO;

    // Priority 1: Use 4v4 ELO if it exists
    const elo4v4 = (player.stats as any[])?.find(
      (stat: any) => stat.teamSize === 4
    )?.elo;

    if (elo4v4 !== undefined && typeof elo4v4 === "number") {
      eloToUse = elo4v4;
    } else {
      // Priority 2: Use highest existing ELO if no 4v4
      const existingElos = (player.stats as any[])
        ?.map((stat: any) => stat.elo)
        .filter((elo: any) => typeof elo === "number") as number[];

      if (existingElos && existingElos.length > 0) {
        eloToUse = Math.max(...existingElos);
      }
      // Priority 3: Default 800 (already set)
    }

    // Create new stats objects for missing team sizes
    const newStats = missingTeamSizes.map((teamSize) => ({
      teamSize,
      elo: eloToUse,
      wins: 0,
      losses: 0,
    }));

    // Add new stats to the player's stats array
    await db.collection("Players").updateOne(
      { discordId: discordId },
      {
        $push: { stats: { $each: newStats } },
        $set: { updatedAt: new Date() },
      } as any
    );

    return true;
  } catch (error) {
    console.error(
      `Error ensuring player ELO for all team sizes (${discordId}):`,
      error
    );
    return false;
  }
}

