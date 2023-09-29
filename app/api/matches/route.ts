import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    console.log("SearchParams: ", searchParams);
    const ranked = searchParams.get("ranked");
    const client = await clientPromise;
    const db = client.db("ShadowrunWeb");
    const matches = await db
      .collection("Matches")
      .find({ ranked: ranked === "true" })
      .toArray();
    return NextResponse.json({
      ok: true,
      matches: matches,
      status: 201,
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      message: "Error getting matches: " + error,
      status: 500,
    });
  }
}
