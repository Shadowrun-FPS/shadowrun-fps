import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { Video } from "@/types/types";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const isFeatured = searchParams.get("isFeatured");
    const client = await clientPromise;
    const db = client.db("ShadowrunWeb");
    const videos = await db
      .collection("Videos")
      .find({ isFeatured: isFeatured })
      .sort({ tutorialOrder: 1 })
      .toArray();
    console.log("videos: ", videos);
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
