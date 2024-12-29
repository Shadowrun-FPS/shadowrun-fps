import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET(request: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db("ShadowrunWeb");
    const videos = await db
      .collection("Videos")
      .find({ isFeatured: isFeatured })
      .sort({ tutorialOrder: 1 })
      .toArray();
    return NextResponse.json({
      ok: true,
      results: videos,
      status: 201,
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      message: "Error getting video list: " + error,
      status: 500,
    });
  }
}
