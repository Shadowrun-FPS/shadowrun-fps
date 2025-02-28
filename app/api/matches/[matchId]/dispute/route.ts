import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(
  req: NextRequest,
  { params }: { params: { matchId: string } }
) {
  try {
    const { disputerId, reason, evidence } = await req.json();
    const client = await clientPromise;
    const db = client.db("ShadowrunWeb");

    // Create dispute record
    await db.collection("Disputes").insertOne({
      matchId: new ObjectId(params.matchId),
      disputerId,
      reason,
      evidence,
      status: "open",
      createdAt: new Date(),
      resolution: null,
      resolvedBy: null,
      resolvedAt: null,
    });

    // Update match status
    await db.collection("Matches").updateOne(
      { _id: new ObjectId(params.matchId) },
      {
        $set: {
          status: "disputed",
          disputeDetails: {
            disputerId,
            reason,
            timestamp: new Date(),
          },
        },
      }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to submit dispute:", error);
    return NextResponse.json(
      { error: "Failed to submit dispute" },
      { status: 500 }
    );
  }
}
