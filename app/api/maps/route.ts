import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET(request: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db();

    // Get all maps from the database
    const maps = await db.collection("Maps").find({}).toArray();

    // Transform MongoDB _id to string
    const transformedMaps = maps.map((map) => ({
      ...map,
      _id: map._id.toString(),
    }));

    return NextResponse.json(transformedMaps);
  } catch (error) {
    console.error("Error fetching maps:", error);
    return NextResponse.json(
      { error: "Failed to fetch maps" },
      { status: 500 }
    );
  }
}
