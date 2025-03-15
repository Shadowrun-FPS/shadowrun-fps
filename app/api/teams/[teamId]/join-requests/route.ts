import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(
  req: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || session.user.id;
    const { db } = await connectToDatabase();
    const teamId = params.teamId;

    // Check for any pending requests
    const pendingRequest = await db.collection("TeamJoinRequests").findOne({
      teamId: teamId,
      userId: userId,
      status: "pending",
    });

    return NextResponse.json({
      hasPendingRequest: !!pendingRequest,
    });
  } catch (error) {
    console.error("Error checking join requests:", error);
    return NextResponse.json(
      { error: "Failed to check join requests" },
      { status: 500 }
    );
  }
}
