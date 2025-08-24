import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { authOptions } from "@/lib/auth";
import { SECURITY_CONFIG } from "@/lib/security-config";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { queueId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated
    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be signed in to remove a player" },
        { status: 401 }
      );
    }

    // Check if user is admin or moderator
    const isAdminOrMod =
      session?.user?.id === SECURITY_CONFIG.DEVELOPER_ID ||
      (session.user.roles &&
        (session.user.roles.includes("admin") ||
          session.user.roles.includes("moderator")));

    if (!isAdminOrMod) {
      return NextResponse.json(
        { error: "You don't have permission to remove players" },
        { status: 403 }
      );
    }

    const { playerId } = await req.json();

    if (!playerId) {
      return NextResponse.json(
        { error: "Player ID is required" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("ShadowrunWeb");

    // Remove player from queue
    const result = await db
      .collection("Queues")
      .updateOne({ _id: new ObjectId(params.queueId) }, {
        $pull: {
          players: { discordId: playerId },
        },
      } as any);

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: "Failed to remove player" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Player removed successfully",
    });
  } catch (error) {
    console.error("Error removing player:", error);
    return NextResponse.json(
      { error: "Failed to remove player" },
      { status: 500 }
    );
  }
}
