import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { v4 as uuidv4 } from "uuid";
import { SECURITY_CONFIG } from "@/lib/security-config";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated
    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be signed in to create a queue" },
        { status: 401 }
      );
    }

    const isAdmin =
      session.user.id === SECURITY_CONFIG.DEVELOPER_ID || session.user.isAdmin;

    if (!isAdmin) {
      return NextResponse.json(
        { error: "You don't have permission to create queues" },
        { status: 403 }
      );
    }

    const { db } = await connectToDatabase();
    const data = await req.json();

    // Validate required fields
    const { teamSize, eloTier, minElo, maxElo, gameType, status } = data;

    if (!teamSize || !eloTier || minElo === undefined || maxElo === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate ELO range
    if (minElo >= maxElo) {
      return NextResponse.json(
        { error: "Min ELO must be less than Max ELO" },
        { status: 400 }
      );
    }

    // Create queue document
    const queueData = {
      queueId: uuidv4(),
      gameType: gameType || "ranked",
      teamSize,
      players: [],
      eloTier,
      minElo,
      maxElo,
      status: status || "active",
      createdAt: new Date(),
      createdBy: {
        discordId: session.user.id,
        discordNickname: session.user.name || "Unknown",
      },
    };

    const result = await db.collection("Queues").insertOne(queueData);

    // Emit event to notify clients about the new queue
    // This would typically be handled by your real-time system

    return NextResponse.json(
      { success: true, queueId: queueData.queueId, _id: result.insertedId },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating queue:", error);
    return NextResponse.json(
      { error: "Failed to create queue" },
      { status: 500 }
    );
  }
}
