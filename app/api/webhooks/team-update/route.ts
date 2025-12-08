import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { findTeamAcrossCollections, getTeamCollectionName } from "@/lib/team-collections";
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity, validateBody } from "@/lib/api-wrapper";
import { revalidatePath } from "next/cache";

async function postTeamUpdateHandler(req: NextRequest) {
  const { db } = await connectToDatabase();
  const body = await req.json();
  const validation = validateBody(body, {
    teamId: { type: "string", required: true, maxLength: 50 },
    action: { type: "string", required: true, maxLength: 50 },
  });

  if (!validation.valid) {
    return NextResponse.json(
      { error: validation.errors?.join(", ") || "Invalid input" },
      { status: 400 }
    );
  }

  const { teamId, action } = validation.data! as {
    teamId: string;
    action: string;
  };

  const sanitizedTeamId = sanitizeString(teamId, 50);
  if (!ObjectId.isValid(sanitizedTeamId)) {
    return NextResponse.json(
      { error: "Invalid team ID format" },
      { status: 400 }
    );
  }

    const teamResult = await findTeamAcrossCollections(db, sanitizedTeamId);
    if (!teamResult) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }
    const team = teamResult.team;
    const collectionName = teamResult.collectionName;
    const teamSize = team.teamSize || 4;

    // Get all team members' IDs
    const memberIds = team.members.map((member: any) => member.discordId);

    // Fetch player stats for all team members
    const players = await db
      .collection("Players")
      .find({ discordId: { $in: memberIds } })
      .toArray();

    // Create a map of discordId to player ELO for quick lookup
    const playerEloMap = new Map();
    let memberElos = [];

    for (const player of players) {
      // Find the stats object for this team's size in the player's stats array
      const statsForTeamSize = player.stats?.find(
        (stat: any) => stat.teamSize === teamSize
      );

      if (statsForTeamSize && statsForTeamSize.elo) {
        const playerElo = parseInt(statsForTeamSize.elo);
        playerEloMap.set(player.discordId, playerElo);

        // Store for logging
        memberElos.push({
          name: player.discordNickname || player.discordId,
          elo: playerElo,
        });
      }
    }

    const updatedMembers = team.members.map((member: any) => {
      const currentElo = playerEloMap.get(member.discordId);
      if (currentElo) {
        return {
          ...member,
          elo: currentElo,
        };
      }
      return member;
    });

    const totalElo = updatedMembers.reduce((sum: number, member: any) => {
      return sum + (member.elo || 0);
    }, 0);

    safeLog.log("Team ELO updated", {
      teamId: sanitizedTeamId,
      action: sanitizeString(action, 50),
      totalElo,
      memberCount: memberElos.length,
    });

    await db.collection(collectionName).updateOne(
      { _id: new ObjectId(sanitizedTeamId) },
      {
        $set: {
          members: updatedMembers,
          teamElo: totalElo,
        },
      }
    );

    revalidatePath("/teams");
    revalidatePath(`/teams/${sanitizedTeamId}`);

    return NextResponse.json({
      success: true,
      teamElo: totalElo,
      message: `Team ELO updated successfully after ${sanitizeString(action, 50)}`,
    });
}

export const POST = withApiSecurity(postTeamUpdateHandler, {
  rateLimiter: "api",
  revalidatePaths: ["/teams"],
});
