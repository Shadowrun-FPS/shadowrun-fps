import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET(request: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db("ShadowrunWeb");
    const matches = await db.collection("Matches").find().toArray();
    return NextResponse.json({
      ok: true,
      results: matches,
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
