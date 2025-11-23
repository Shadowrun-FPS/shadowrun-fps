import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import type { MongoTeam } from "@/types/mongodb";
import { containsProfanity } from "@/lib/profanity-filter";

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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tag = searchParams.get("tag");
    const name = searchParams.get("name");
    const { db } = await connectToDatabase();

    let query = {};
    if (tag) {
      query = { tag: { $regex: new RegExp(tag, "i") } };
    } else if (name) {
      query = { name: { $regex: new RegExp(name, "i") } };
    }

    const teams = await db
      .collection("Teams")
      .find(query)
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray();

    return NextResponse.json(teams);
  } catch (error) {
    console.error("Error fetching teams:", error);
    return NextResponse.json(
      { error: "Failed to fetch teams" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, description, tag, captain, captainProfilePicture, teamSize } =
      await req.json();

    // Check for profanity in team name, tag, and description
    if (containsProfanity(name)) {
      return NextResponse.json(
        { error: "Team name contains inappropriate language" },
        { status: 400 }
      );
    }

    if (containsProfanity(tag)) {
      return NextResponse.json(
        { error: "Team tag contains inappropriate language" },
        { status: 400 }
      );
    }

    if (containsProfanity(description)) {
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

    // Validate teamSize
    const validTeamSize = teamSize ? parseInt(teamSize) : 4;
    if (![2, 3, 4, 5].includes(validTeamSize)) {
      return NextResponse.json(
        { error: "Team size must be 2, 3, 4, or 5" },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    // Check if name or tag already exists
    const existingTeam = await db.collection("Teams").findOne({
      $or: [
        { name: { $regex: new RegExp(`^${name}$`, "i") } },
        { tag: { $regex: new RegExp(`^${tag}$`, "i") } },
      ],
    });

    if (existingTeam) {
      return NextResponse.json(
        { error: "Team name or tag already exists" },
        { status: 400 }
      );
    }

    // Check if the user already has a team of this specific size
    const userTeamOfSize = await db.collection("Teams").findOne({
      "members.discordId": session.user.id,
      teamSize: validTeamSize,
    });

    if (userTeamOfSize) {
      return NextResponse.json(
        { error: `You already have a ${validTeamSize}-person team. You can only have one team per team size.` },
        { status: 400 }
      );
    }

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

    // Create team
    const result = await db.collection("Teams").insertOne({
      name,
      description,
      tag: tag.toUpperCase(),
      teamSize: validTeamSize,
      createdAt: new Date(),
      updatedAt: new Date(),
      captain: captainObject,
      members: [memberObject],
      teamElo: player?.elo,
    });

    return NextResponse.json({
      id: result.insertedId.toString(),
      name,
      tag,
      description,
    });
  } catch (error) {
    console.error("Error creating team:", error);
    return NextResponse.json(
      { error: "Failed to create team" },
      { status: 500 }
    );
  }
}
