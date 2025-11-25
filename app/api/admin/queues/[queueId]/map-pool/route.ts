import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { SECURITY_CONFIG } from "@/lib/security-config";

const DEVELOPER_DISCORD_ID = "238329746671271936";

// GET endpoint to fetch queue map pool
export async function GET(
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

    const { db } = await connectToDatabase();
    const queue = await db.collection("Queues").findOne({
      _id: new ObjectId(params.queueId),
    });

    if (!queue) {
      return NextResponse.json({ error: "Queue not found" }, { status: 404 });
    }

    return NextResponse.json({
      mapPool: queue.mapPool || null,
      queueId: queue.queueId,
      gameType: queue.gameType,
      teamSize: queue.teamSize,
      eloTier: queue.eloTier,
    });
  } catch (error) {
    console.error("Error fetching queue map pool:", error);
    return NextResponse.json(
      { error: "Failed to fetch queue map pool" },
      { status: 500 }
    );
  }
}

// PATCH endpoint to update queue map pool
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
    const { mapPool } = body;

    // Validate mapPool is an array of map IDs (strings or ObjectIds)
    if (mapPool !== null && !Array.isArray(mapPool)) {
      return NextResponse.json(
        { error: "mapPool must be an array or null" },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    
    // Check if queue exists
    const queue = await db.collection("Queues").findOne({
      _id: new ObjectId(params.queueId),
    });

    if (!queue) {
      return NextResponse.json({ error: "Queue not found" }, { status: 404 });
    }

    // Update the queue with the new map pool
    // If mapPool is null, remove the field (use default behavior)
    const updateData: any = {};
    if (mapPool === null) {
      updateData.$unset = { mapPool: "" };
    } else {
      updateData.$set = { mapPool };
    }

    await db.collection("Queues").updateOne(
      { _id: new ObjectId(params.queueId) },
      updateData
    );

    return NextResponse.json({
      success: true,
      message: "Queue map pool updated successfully",
      mapPool,
    });
  } catch (error) {
    console.error("Error updating queue map pool:", error);
    return NextResponse.json(
      { error: "Failed to update queue map pool" },
      { status: 500 }
    );
  }
}

