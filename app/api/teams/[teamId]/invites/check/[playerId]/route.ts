import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(
  req: NextRequest,
  {
    params,
  }: {
    params:
      | Promise<{ teamId: string; playerId: string }>
      | { teamId: string; playerId: string };
  }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { db } = await connectToDatabase();
    // Handle both sync and async params (Next.js 15+ uses async params)
    const resolvedParams = await Promise.resolve(params);
    const { teamId, playerId } = resolvedParams;

    // Validate teamId is a valid ObjectId
    if (!ObjectId.isValid(teamId)) {
      return NextResponse.json({ error: "Invalid team ID" }, { status: 400 });
    }

    // Check if there's a pending invite for this player from this team
    // inviteeId is stored as a string in the database
    const query = {
      teamId: new ObjectId(teamId),
      inviteeId: String(playerId), // Ensure it's a string to match database
      status: "pending",
    };

    const pendingInvite = await db.collection("TeamInvites").findOne(query);

    return NextResponse.json({
      isInvited: !!pendingInvite,
    });
  } catch (error) {
    console.error("Error checking invite status:", error);
    return NextResponse.json(
      { error: "Failed to check invite status" },
      { status: 500 }
    );
  }
}
