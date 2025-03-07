import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import clientPromise from "@/lib/mongodb";
import { authOptions } from "@/lib/auth";

// Add this line to explicitly mark the route as dynamic
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated
    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be signed in to check registration" },
        { status: 401 }
      );
    }

    const client = await clientPromise;
    const db = client.db("ShadowrunWeb");

    // Check if player exists in the Players collection
    const player = await db.collection("Players").findOne({
      discordId: session.user.id,
    });

    return NextResponse.json({
      isRegistered: !!player,
    });
  } catch (error) {
    console.error("Error checking registration:", error);
    return NextResponse.json(
      { error: "Failed to check registration" },
      { status: 500 }
    );
  }
}
