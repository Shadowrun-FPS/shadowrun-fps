import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { matchId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated
    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be signed in to delete a match" },
        { status: 401 }
      );
    }

    // Debug session information
    console.log("Session user ID:", session.user.id);
    console.log("Expected ID:", "238329746671271936");
    console.log("ID comparison:", session.user.id === "238329746671271936");
    console.log("ID type:", typeof session.user.id);
    console.log("Full session user:", JSON.stringify(session.user, null, 2));

    // Only allow your specific Discord ID - with more flexible comparison
    if (
      session.user.id !== "238329746671271936" &&
      session.user.id.toString() !== "238329746671271936"
    ) {
      return NextResponse.json(
        { error: "This endpoint is restricted" },
        { status: 403 }
      );
    }

    // Connect to database
    const { db } = await connectToDatabase();

    // Delete the match
    const result = await db.collection("Matches").deleteOne({
      matchId: params.matchId,
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Match deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting match:", error);
    return NextResponse.json(
      { error: "Failed to delete match" },
      { status: 500 }
    );
  }
}
