import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("ShadowrunWeb");

    const types = await db.collection("Queues").distinct("gameType");

    return NextResponse.json({ types });
  } catch (error) {
    console.error("Failed to fetch queue types:", error);
    return NextResponse.json(
      { error: "Failed to fetch queue types" },
      { status: 500 }
    );
  }
}
