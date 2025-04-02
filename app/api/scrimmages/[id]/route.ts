import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Remove session check to allow public access
    // const session = await getServerSession(authOptions);
    // if (!session) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    const { db } = await connectToDatabase();

    // First try to find by _id
    let scrimmage = await db.collection("Scrimmages").findOne({
      _id: new ObjectId(params.id),
    });

    // If not found, try to find by scrimmageId
    if (!scrimmage) {
      scrimmage = await db.collection("Scrimmages").findOne({
        scrimmageId: params.id,
      });
    }

    if (!scrimmage) {
      return NextResponse.json(
        { error: "Scrimmage not found" },
        { status: 404 }
      );
    }

    // No need to look up current team data, we should use the stored team data

    return NextResponse.json(scrimmage);
  } catch (error) {
    console.error("Error fetching scrimmage:", error);
    return NextResponse.json(
      { error: "Failed to fetch scrimmage" },
      { status: 500 }
    );
  }
}
