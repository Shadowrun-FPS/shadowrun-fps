import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import type { MongoTeam } from "@/types/mongodb";

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

    const { name, description, tag, captain, captainProfilePicture } =
      await req.json();

    // Validation
    if (!name || !tag) {
      return NextResponse.json(
        { error: "Team name and tag are required" },
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

    // Check if the user is already in a team
    const userInTeam = await db.collection("Teams").findOne({
      "members.discordId": session.user.id,
    });

    if (userInTeam) {
      return NextResponse.json(
        { error: "You are already a member of a team" },
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
