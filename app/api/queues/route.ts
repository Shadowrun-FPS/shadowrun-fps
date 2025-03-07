import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

export async function GET(req: NextRequest) {
  try {
    const { db } = await connectToDatabase();

    // Fixed: Use "Queues" collection with capital Q
    const queues = await db.collection("Queues").find({}).toArray();

    return NextResponse.json(queues);
  } catch (error) {
    console.error("Error fetching queues:", error);
    return NextResponse.json(
      { error: "Failed to fetch queues" },
      { status: 500 }
    );
  }
}
