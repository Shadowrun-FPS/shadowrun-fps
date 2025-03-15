import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const searchTerm = searchParams.get("q");

    if (!searchTerm || searchTerm.length < 3) {
      return NextResponse.json(
        { error: "Search term must be at least 3 characters" },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    // Search players by username or nickname
    const players = await db
      .collection("Players")
      .find({
        $or: [
          { discordUsername: { $regex: searchTerm, $options: "i" } },
          { discordNickname: { $regex: searchTerm, $options: "i" } },
        ],
        // Don't include the current user in results
        discordId: { $ne: session.user.id },
      })
      .limit(10)
      .project({
        _id: 0,
        discordId: 1,
        discordUsername: 1,
        discordNickname: 1,
        discordProfilePicture: 1,
      })
      .toArray();

    return NextResponse.json(players);
  } catch (error) {
    console.error("Error searching players:", error);
    return NextResponse.json(
      { error: "Failed to search players" },
      { status: 500 }
    );
  }
}
