import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId, Document, WithId } from "mongodb";

interface TeamMember {
  discordId: string;
  discordUsername: string;
  discordNickname: string;
  elo: {
    "4v4": number;
  };
  role: string;
  joinedAt: Date;
}

interface Team extends WithId<Document> {
  _id: ObjectId;
  name: string;
  members: TeamMember[];
}

export async function POST(req: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db("ShadowrunWeb");

    // Create sample members
    const newMembers: TeamMember[] = [
      {
        discordId: "123456789",
        discordUsername: "Player1",
        discordNickname: "Pro Player 1",
        elo: { "4v4": 1500 },
        role: "captain",
        joinedAt: new Date(),
      },
      {
        discordId: "987654321",
        discordUsername: "Player2",
        discordNickname: "Pro Player 2",
        elo: { "4v4": 1600 },
        role: "member",
        joinedAt: new Date(),
      },
      // Add more sample members as needed
    ];

    // Create team with members
    const result = await db.collection<Team>("Teams").findOneAndUpdate(
      { name: "Sinful's Devils" },
      {
        $push: {
          members: {
            $each: newMembers,
          },
        } as any, // Type assertion needed due to MongoDB types limitation
      },
      {
        upsert: true,
        returnDocument: "after",
      }
    );

    if (!result || !result.value) {
      return NextResponse.json(
        { error: "Failed to seed team" },
        { status: 400 }
      );
    }

    return NextResponse.json(result.value);
  } catch (error) {
    console.error("Failed to seed team:", error);
    return NextResponse.json({ error: "Failed to seed team" }, { status: 500 });
  }
}
