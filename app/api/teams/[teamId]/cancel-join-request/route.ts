import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity } from "@/lib/api-wrapper";
import { revalidatePath } from "next/cache";

async function postCancelJoinRequestHandler(
  req: NextRequest,
  { params }: { params: { teamId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const teamId = sanitizeString(params.teamId, 50);
  if (!ObjectId.isValid(teamId)) {
    return NextResponse.json(
      { error: "Invalid team ID" },
      { status: 400 }
    );
  }

  const userId = sanitizeString(session.user.id, 50);
  const { db } = await connectToDatabase();

    const joinRequest = await db.collection("TeamJoinRequests").findOne({
      teamId,
      userId,
      status: "pending",
    });

    if (!joinRequest) {
      return NextResponse.json(
        { error: "No pending join request found" },
        { status: 404 }
      );
    }

    // Update the join request status to cancelled
    await db.collection("TeamJoinRequests").updateOne(
      { _id: joinRequest._id },
      {
        $set: {
          status: "cancelled",
          cancelledAt: new Date(),
        },
      }
    );

    await db.collection("Notifications").deleteMany({
      "metadata.teamId": teamId,
      "metadata.requesterId": userId,
      type: "team_join_request",
    });

    revalidatePath("/teams");
    revalidatePath(`/teams/${teamId}`);

    return NextResponse.json({
      success: true,
      message: "Join request cancelled successfully",
    });
}

export const POST = withApiSecurity(postCancelJoinRequestHandler, {
  rateLimiter: "api",
  requireAuth: true,
  revalidatePaths: ["/teams"],
});
