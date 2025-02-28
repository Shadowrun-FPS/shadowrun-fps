import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET(req: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db("ShadowrunWeb");

    const queues = await db
      .collection("Queues")
      .find({ status: "active" })
      .toArray();

    return NextResponse.json(queues);
  } catch (error) {
    console.error("Failed to fetch queues:", error);
    return NextResponse.json(
      { error: "Failed to fetch queues" },
      { status: 500 }
    );
  }
}
