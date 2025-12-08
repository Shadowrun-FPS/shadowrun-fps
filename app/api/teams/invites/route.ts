import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity } from "@/lib/api-wrapper";

export const dynamic = "force-dynamic";

async function getTeamInvitesHandler(req: NextRequest) {
  const userIdParam = req.nextUrl.searchParams.get("userId");
  if (!userIdParam) {
    return NextResponse.json(
      { error: "User ID is required" },
      { status: 400 }
    );
  }

  const userId = sanitizeString(userIdParam, 50);
  const client = await clientPromise;
  const db = client.db("ShadowrunWeb");

    // Get pending invites for the user
    const invites = await db
      .collection("TeamInvites")
      .aggregate([
        {
          $match: {
            inviteeId: userId,
            status: "pending",
          },
        },
        {
          $lookup: {
            from: "Teams",
            let: { teamId: "$teamId" },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$_id", "$$teamId"] },
                },
              },
            ],
            as: "team",
          },
        },
        {
          $project: {
            _id: 1,
            teamId: 1,
            teamName: 1,
            inviterId: 1,
            status: 1,
            createdAt: 1,
            team: { $arrayElemAt: ["$team", 0] },
          },
        },
      ])
      .toArray();

    const response = NextResponse.json({ invites });
    response.headers.set(
      "Cache-Control",
      "private, no-cache, no-store, must-revalidate"
    );
    return response;
}

export const GET = withApiSecurity(getTeamInvitesHandler, {
  rateLimiter: "api",
  requireAuth: false,
});
