import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // Get the match ID from the request body
    const { matchId } = await req.json();

    if (!matchId) {
      return NextResponse.json(
        { error: "Match ID is required" },
        { status: 400 }
      );
    }

    console.log("Attempting to delete match:", matchId);

    // Connect to database
    const { db } = await connectToDatabase();

    // Delete the match without any permission checks
    const result = await db.collection("Matches").deleteOne({
      matchId: matchId,
    });

    console.log("Delete result:", result);

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Match not found or already deleted" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Match deleted successfully",
    });
  } catch (error) {
    console.error("Error in admin override delete:", error);
    return NextResponse.json(
      {
        error: "Failed to delete match",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
