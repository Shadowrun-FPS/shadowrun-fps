import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import type { MongoTeam } from "@/types/mongodb";
import { containsProfanity } from "@/lib/profanity-filter";
import { ensurePlayerEloForAllTeamSizes } from "@/lib/ensure-player-elo";
import { getTeamCollectionName, getAllTeamCollectionNames } from "@/lib/team-collections";
import { safeLog, rateLimiters, getClientIdentifier, sanitizeString } from "@/lib/security";
import { cachedQuery } from "@/lib/query-cache";
import { withApiSecurity, validateBody } from "@/lib/api-wrapper";
import { revalidatePath } from "next/cache";

interface TeamMember {
  discordId: string;
  discordNickname: string;
  role: string;
}

interface Player {
  discordId: string;
  discordNickname: string;
  stats: {
    teamSize: number;
    elo: number;
  }[];
}

const BAD_WORDS = [
  "badword1",
  "badword2",
  // Add your list of bad words here
];

function containsBadWords(text: string): boolean {
  const normalizedText = text.toLowerCase();
  return BAD_WORDS.some(
    (word) =>
      normalizedText.includes(word.toLowerCase()) ||
      normalizedText.replace(/[^a-zA-Z0-9]/g, "").includes(word.toLowerCase())
  );
}

async function getTeamsHandler(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tag = sanitizeString(searchParams.get("tag") || "", 10);
  const name = sanitizeString(searchParams.get("name") || "", 100);
  const { db } = await connectToDatabase();

  let query = {};
  if (tag) {
    query = { tag: { $regex: new RegExp(tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") } };
  } else if (name) {
    query = { name: { $regex: new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") } };
  }

  const cacheKey = `teams:${tag}:${name}`;

  const result = await cachedQuery(
    cacheKey,
    async () => {
      const allCollections = getAllTeamCollectionNames();
      const allTeams = [];
      
      for (const collectionName of allCollections) {
        const teams = await db
          .collection(collectionName)
          .find(query)
          .sort({ createdAt: -1 })
          .limit(100)
          .toArray();
        allTeams.push(...teams);
      }

      allTeams.sort((a, b) => {
        const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bDate - aDate;
      });

      return allTeams.slice(0, 100);
    },
    2 * 60 * 1000 // Cache for 2 minutes
  );

  return NextResponse.json(result, {
    headers: {
      "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600",
    },
  });
}

export const GET = withApiSecurity(getTeamsHandler, {
  rateLimiter: "api",
  cacheable: true,
  cacheMaxAge: 120,
});

async function postTeamsHandler(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  
  // Validate and sanitize input
  const validation = validateBody(body, {
    name: { type: "string", required: true, maxLength: 50 },
    description: { type: "string", required: false, maxLength: 200 },
    tag: { type: "string", required: true, maxLength: 10 },
    teamSize: { type: "number", required: false, min: 2, max: 5 },
  });

  if (!validation.valid) {
    return NextResponse.json(
      { error: validation.errors?.join(", ") || "Invalid input" },
      { status: 400 }
    );
  }

  const validationData = validation.data! as {
    name: string;
    description?: string;
    tag: string;
    captain?: string;
    captainProfilePicture?: string;
    teamSize?: number;
  };
  const { name, description, tag, captain, captainProfilePicture, teamSize } = validationData;

    // Check for profanity in team name, tag, and description
    if (containsProfanity(name)) {
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

    if (description && typeof description === "string" && containsProfanity(description)) {
      return NextResponse.json(
        { error: "Team description contains inappropriate language" },
        { status: 400 }
      );
    }

    // Validation
    if (!name || !tag) {
      return NextResponse.json(
        { error: "Team name and tag are required" },
        { status: 400 }
      );
    }

    // Validate max lengths
    if (name.length > 50) {
      return NextResponse.json(
        { error: "Team name must be 50 characters or less" },
        { status: 400 }
      );
    }

    if (description && description.length > 200) {
      return NextResponse.json(
        { error: "Team description must be 200 characters or less" },
        { status: 400 }
      );
    }

    // Validate teamSize - ensure it's a number
    let validTeamSize: number;
    if (teamSize === undefined || teamSize === null) {
      validTeamSize = 4;
    } else if (typeof teamSize === "string") {
      validTeamSize = parseInt(teamSize, 10);
    } else if (typeof teamSize === "number") {
      validTeamSize = teamSize;
    } else {
      validTeamSize = 4;
    }
    
    // Ensure it's a valid integer
    if (isNaN(validTeamSize) || ![2, 3, 4, 5].includes(validTeamSize)) {
      return NextResponse.json(
        { error: "Team size must be 2, 3, 4, or 5" },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    // Check if name or tag already exists across ALL team collections
    const allCollections = getAllTeamCollectionNames();
    let existingTeam = null;
    for (const collectionName of allCollections) {
      existingTeam = await db.collection(collectionName).findOne({
        $or: [
          { name: { $regex: new RegExp(`^${name}$`, "i") } },
          { tag: { $regex: new RegExp(`^${tag}$`, "i") } },
        ],
      });
      if (existingTeam) break;
    }

    if (existingTeam) {
      return NextResponse.json(
        { error: "Team name or tag already exists" },
        { status: 400 }
      );
    }

    // Check if the user already has a team of this specific size
    const teamCollectionName = getTeamCollectionName(validTeamSize);
    const userTeamOfSize = await db.collection(teamCollectionName).findOne({
      $or: [
        { "members.discordId": session.user.id },
        { "captain.discordId": session.user.id },
      ],
    });

    if (userTeamOfSize) {
      return NextResponse.json(
        { error: `You already have a ${validTeamSize}-person team. You can only have one team per team size.` },
        { status: 400 }
      );
    }

    // Ensure captain has ELO records for all team sizes
    await ensurePlayerEloForAllTeamSizes(session.user.id);

    // Get player information from Players collection to ensure we have the latest data
    const player = await db.collection("Players").findOne({
      discordId: session.user.id,
    });

    // Create the captain object with reference to player data
    const captainObject = {
      discordId: session.user.id,
      discordUsername: player?.discordUsername || session.user.name,
      discordNickname:
        player?.discordNickname || session.user.nickname || session.user.name,
      discordProfilePicture:
        player?.discordProfilePicture ||
        captainProfilePicture ||
        session.user.image,
      playerId: player?._id ? player._id.toString() : null, // Reference to the player document
    };

    // Create the member object for the captain (as the first member)
    const memberObject = {
      ...captainObject,
      role: "captain",
      joinedAt: new Date(),
    };

    // Create team in the appropriate collection based on team size
    // Double-check the collection name matches the team size (in case teamCollectionName was modified)
    const finalCollectionName = getTeamCollectionName(validTeamSize);
    
    safeLog.log(`Creating ${validTeamSize}v${validTeamSize} team in collection: ${finalCollectionName}`);
    
    const result = await db.collection(finalCollectionName).insertOne({
      name: sanitizeString(name, 50),
      description: description ? sanitizeString(description, 200) : "",
      tag: sanitizeString(tag, 10).toUpperCase(),
      teamSize: validTeamSize,
      createdAt: new Date(),
      updatedAt: new Date(),
      captain: captainObject,
      members: [memberObject],
      teamElo: 0,
    });

    const { recalculateTeamElo } = await import("@/lib/team-elo-calculator");
    try {
      await recalculateTeamElo(result.insertedId.toString());
    } catch (error) {
      safeLog.error("Error calculating initial team ELO:", error);
    }

    // Revalidate paths
    revalidatePath("/teams");
    revalidatePath(`/teams/${result.insertedId.toString()}`);

    return NextResponse.json({
      id: result.insertedId.toString(),
      name,
      tag,
      description,
    });
}

export const POST = withApiSecurity(postTeamsHandler, {
  rateLimiter: "api",
  requireAuth: true,
  revalidatePaths: ["/teams"],
});
