import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { SECURITY_CONFIG } from "@/lib/security-config";

const DEVELOPER_DISCORD_ID = "238329746671271936";

// PATCH endpoint to update queue details
export async function PATCH(
  req: NextRequest,
  { params }: { params: { queueId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check authorization
    const isDeveloper =
      session.user.id === SECURITY_CONFIG.DEVELOPER_ID ||
      session.user.id === DEVELOPER_DISCORD_ID;
    const isAdmin = session.user.roles?.includes("admin") || session.user.isAdmin;
    const isFounder = session.user.roles?.includes("founder");

    if (!isDeveloper && !isAdmin && !isFounder) {
      return NextResponse.json(
        { error: "Not authorized" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { gameType, eloTier, minElo, maxElo } = body;

    // Validate required fields
    if (!gameType || !eloTier) {
      return NextResponse.json(
        { error: "gameType and eloTier are required" },
        { status: 400 }
      );
    }

    // Validate ELO range if provided
    if (minElo !== undefined && maxElo !== undefined) {
      if (minElo >= maxElo) {
        return NextResponse.json(
          { error: "minElo must be less than maxElo" },
          { status: 400 }
        );
      }
    }

    const { db } = await connectToDatabase();
    
    // Check if queue exists
    const queue = await db.collection("Queues").findOne({
      _id: new ObjectId(params.queueId),
    });

    if (!queue) {
      return NextResponse.json({ error: "Queue not found" }, { status: 404 });
    }

    // Update the queue
    const updateData: any = {
      $set: {
        gameType,
        eloTier,
      },
    };

    if (minElo !== undefined) {
      updateData.$set.minElo = minElo;
    }
    if (maxElo !== undefined) {
      updateData.$set.maxElo = maxElo;
    }

    await db.collection("Queues").updateOne(
      { _id: new ObjectId(params.queueId) },
      updateData
    );

    return NextResponse.json({
      success: true,
      message: "Queue details updated successfully",
    });
  } catch (error) {
    console.error("Error updating queue details:", error);
    return NextResponse.json(
      { error: "Failed to update queue details" },
      { status: 500 }
    );
  }
}

