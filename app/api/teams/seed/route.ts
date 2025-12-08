import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId, Document, WithId } from "mongodb";
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity } from "@/lib/api-wrapper";
import { revalidatePath } from "next/cache";

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

async function postSeedTeamHandler(req: NextRequest) {
  const client = await clientPromise;
  const db = client.db("ShadowrunWeb");

  const newMembers: TeamMember[] = [
    {
      discordId: sanitizeString("123456789", 50),
      discordUsername: sanitizeString("Player1", 100),
      discordNickname: sanitizeString("Pro Player 1", 100),
      elo: { "4v4": 1500 },
      role: "captain",
      joinedAt: new Date(),
    },
    {
      discordId: sanitizeString("987654321", 50),
      discordUsername: sanitizeString("Player2", 100),
      discordNickname: sanitizeString("Pro Player 2", 100),
      elo: { "4v4": 1600 },
      role: "member",
      joinedAt: new Date(),
    },
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

    revalidatePath("/teams");

    return NextResponse.json(result.value);
}

export const POST = withApiSecurity(postSeedTeamHandler, {
  rateLimiter: "admin",
  requireAuth: true,
  requireAdmin: true,
  revalidatePaths: ["/teams"],
});
