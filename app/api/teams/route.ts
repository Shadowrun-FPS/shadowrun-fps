import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
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

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("ShadowrunWeb");

    const teams = await db
      .collection("Teams")
      .find({})
      .sort({ teamElo: -1 })
      .toArray();

    const teamsWithStats = teams.map((team) => ({
      ...team,
      _id: team._id.toString(),
      winRatio: team.wins / (team.wins + team.losses) || 0,
    }));

    return NextResponse.json(teamsWithStats);
  } catch (error) {
    console.error("Failed to fetch teams:", error);
    return NextResponse.json(
      { error: "Failed to fetch teams" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, tag, description, captain } = await req.json();
    const client = await clientPromise;
    const db = client.db("ShadowrunWeb");

    // Validate input
    if (!name || !tag || !description || !captain) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Check if team name, tag, or description contains inappropriate language
    if (
      containsBadWords(name) ||
      containsBadWords(tag) ||
      containsBadWords(description)
    ) {
      return NextResponse.json(
        {
          error:
            "Team name, tag, or description contains inappropriate language",
        },
        { status: 400 }
      );
    }

    // Check if team name or tag already exists
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

    // Check if player is already a member of another team
    const existingTeamMembership = await db.collection("Teams").findOne({
      "members.discordId": captain,
    });

    if (existingTeamMembership) {
      return NextResponse.json(
        { error: "Player is already a member of another team" },
        { status: 400 }
      );
    }

    // Get captain details
    const captainDetails = await db.collection("Players").findOne({
      discordId: captain,
    });

    if (!captainDetails) {
      return NextResponse.json({ error: "Captain not found" }, { status: 404 });
    }

    // Create team
    const result = await db.collection("Teams").insertOne({
      name,
      tag: tag.toUpperCase(),
      description,
      captain: {
        discordId: captainDetails.discordId,
        discordUsername: captainDetails.discordUsername,
        discordNickname: captainDetails.discordNickname,
      },
      members: [
        {
          discordId: captainDetails.discordId,
          discordUsername: captainDetails.discordUsername,
          discordNickname: captainDetails.discordNickname,
          role: "captain",
          joinedAt: new Date(),
        },
      ],
      elo: 1500,
      wins: 0,
      losses: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({
      _id: result.insertedId,
      name,
      tag,
      description,
    });
  } catch (error) {
    console.error("Failed to create team:", error);
    return NextResponse.json(
      { error: "Failed to create team" },
      { status: 500 }
    );
  }
}
