import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { authOptions } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the current user session
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is an admin or the specific user
    const isAdmin = session?.user?.roles?.includes("admin");
    const isAuthorizedUser = session?.user?.id === "238329746671271936";

    if (!isAdmin && !isAuthorizedUser) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    // Update the tournament status back to "upcoming"
    const result = await db
      .collection("Tournaments")
      .updateOne(
        { _id: new ObjectId(params.id) },
        { $set: { status: "upcoming" } }
      );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Tournament reset successfully",
    });
  } catch (error) {
    console.error("Error resetting tournament:", error);
    return NextResponse.json(
      { error: "Failed to reset tournament" },
      { status: 500 }
    );
  }
}
