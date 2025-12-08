import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import clientPromise from "@/lib/mongodb";
import { authOptions } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";
import { isAdmin } from "@/lib/admin";
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity, validateBody } from "@/lib/api-wrapper";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

async function postCreateMatchHandler(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json(
      { error: "You must be signed in to create a match" },
      { status: 401 }
    );
  }

  if (!isAdmin(session.user.id)) {
    return NextResponse.json(
      { error: "You don't have permission to create matches" },
      { status: 403 }
    );
  }

  const body = await req.json();
  const validation = validateBody(body, {
    team1: { type: "array", required: true },
    team2: { type: "array", required: true },
    maps: { type: "array", required: true },
    teamSize: { type: "number", required: false, min: 2, max: 5 },
    eloTier: { type: "string", required: false, maxLength: 50 },
    type: { type: "string", required: false, maxLength: 50 },
    firstPick: { type: "number", required: false, min: 1, max: 2 },
  });

  if (!validation.valid) {
    return NextResponse.json(
      { error: validation.errors?.join(", ") || "Invalid input" },
      { status: 400 }
    );
  }

  const data = validation.data! as {
    team1: any[];
    team2: any[];
    maps: any[];
    teamSize?: number;
    eloTier?: string;
    type?: string;
    firstPick?: number;
  };

    // Validate team sizes
    const team1Size = data.team1.length;
    const team2Size = data.team2.length;
    const specifiedTeamSize = data.teamSize;
    
    // If teamSize is specified, validate it matches both teams
    if (specifiedTeamSize) {
      if (team1Size !== specifiedTeamSize || team2Size !== specifiedTeamSize) {
        return NextResponse.json(
          { 
            error: `Team size mismatch. Specified team size is ${specifiedTeamSize}, but team1 has ${team1Size} players and team2 has ${team2Size} players.` 
          },
          { status: 400 }
        );
      }
    } else {
      // If not specified, ensure both teams have the same number of players
      if (team1Size !== team2Size) {
        return NextResponse.json(
          { 
            error: `Team size mismatch. Team1 has ${team1Size} players but team2 has ${team2Size} players.` 
          },
          { status: 400 }
        );
      }
    }

    // Validate team size is between 2 and 5
    const finalTeamSize = specifiedTeamSize || team1Size;
    if (finalTeamSize < 2 || finalTeamSize > 5) {
      return NextResponse.json(
        { error: "Team size must be between 2 and 5 players" },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db("ShadowrunWeb");

    // Generate a unique match ID
    const matchId = uuidv4();

    // Create the match document
    const match = {
      matchId,
      status: "in_progress",
      teamSize: finalTeamSize,
      eloTier: data.eloTier || "Open",
      type: data.type || "Custom",
      firstPick: data.firstPick || Math.floor(Math.random() * 2) + 1,
      createdAt: Date.now(),
      createdBy: {
        discordId: session.user.id,
        discordUsername: session.user.name || "",
        discordNickname: session.user.nickname || session.user.name || "",
      },
      maps: data.maps.map((map: any) => ({
        mapName: sanitizeString(map.mapName || map.name || "", 100),
        gameMode: sanitizeString(map.gameMode || "Attrition", 50),
        selected: false,
      })),
      team1: data.team1.map((player: any) => ({
        discordId: sanitizeString(player.discordId || "", 50),
        discordUsername: sanitizeString(player.discordUsername || "", 100),
        discordNickname: sanitizeString(player.discordNickname || player.discordUsername || "", 100),
        discordProfilePicture: player.discordProfilePicture || null,
        initialElo: player.elo || 1500,
        elo: player.elo || 1500,
        eloChange: 0,
        updatedElo: player.elo || 1500,
        isReady: false,
      })),
      team2: data.team2.map((player: any) => ({
        discordId: sanitizeString(player.discordId || "", 50),
        discordUsername: sanitizeString(player.discordUsername || "", 100),
        discordNickname: sanitizeString(player.discordNickname || player.discordUsername || "", 100),
        discordProfilePicture: player.discordProfilePicture || null,
        initialElo: player.elo || 1500,
        elo: player.elo || 1500,
        eloChange: 0,
        updatedElo: player.elo || 1500,
        isReady: false,
      })),
      eloDifference: 0, // This will be calculated later
    };

    await db.collection("Matches").insertOne(match);

    revalidatePath("/matches");
    revalidatePath(`/matches/${matchId}`);

    return NextResponse.json({
      success: true,
      message: "Match created successfully",
      matchId,
    });
}

export const POST = withApiSecurity(postCreateMatchHandler, {
  rateLimiter: "admin",
  requireAuth: true,
  requireAdmin: true,
  revalidatePaths: ["/matches"],
});
