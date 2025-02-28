import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("userId");
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

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

    return NextResponse.json({ invites });
  } catch (error) {
    console.error("Failed to fetch invites:", error);
    return NextResponse.json(
      { error: "Failed to fetch invites" },
      { status: 500 }
    );
  }
}
