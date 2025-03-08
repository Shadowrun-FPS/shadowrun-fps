import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { matchId: string } }
) {
  try {
    console.log(`Fetching match with ID: ${params.matchId}`);

    const client = await clientPromise;
    const db = client.db("ShadowrunWeb");

    const match = await db.collection("Matches").findOne({
      matchId: params.matchId,
    });

    if (!match) {
      console.log(`Match not found with ID: ${params.matchId}`);
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    console.log(`Successfully found match: ${match._id}`);
    return NextResponse.json(match);
  } catch (error) {
    console.error("Error fetching match:", error);
    return NextResponse.json(
      { error: "Failed to fetch match" },
      { status: 500 }
    );
  }
}

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

    // Special case for your Discord ID - always allow
    const isYourAccount = session.user.id === "238329746671271936";

    // Check if user has the required roles
    const hasRequiredRole =
      isYourAccount ||
      (session.user.roles &&
        (session.user.roles.includes("admin") ||
          session.user.roles.includes("moderator") ||
          session.user.roles.includes("founder")));

    // If not authorized, use the admin override endpoint
    if (!hasRequiredRole) {
      return NextResponse.json(
        { error: "You don't have permission to delete matches" },
        { status: 403 }
      );
    }

    // For your account, use the admin override endpoint that we know works
    if (isYourAccount) {
      console.log("Using admin override for your account");

      // Connect to database
      const { db } = await connectToDatabase();

      // Delete the match directly
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
    }

    // For other authorized users, use the regular flow
    const { db } = await connectToDatabase();

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
