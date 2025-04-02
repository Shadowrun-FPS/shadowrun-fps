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

    // Check if the search term might be a Discord ID (all digits)
    const isDiscordId = /^\d+$/.test(searchTerm);

    // Build the query
    let searchQuery;

    if (isDiscordId) {
      // If it looks like a Discord ID, search by exact match
      searchQuery = {
        $or: [
          { discordUsername: { $regex: searchTerm, $options: "i" } },
          { discordNickname: { $regex: searchTerm, $options: "i" } },
          { discordId: searchTerm }, // Add Discord ID search
        ],
        // Don't include the current user in results
        discordId: { $ne: session.user.id },
      };
    } else {
      // Otherwise just search by username or nickname
      searchQuery = {
        $or: [
          { discordUsername: { $regex: searchTerm, $options: "i" } },
          { discordNickname: { $regex: searchTerm, $options: "i" } },
        ],
        // Don't include the current user in results
        discordId: { $ne: session.user.id },
      };
    }

    // Search players
    const players = await db
      .collection("Players")
      .find(searchQuery)
      .limit(10)
      .project({
        _id: 0,
        discordId: 1,
        discordUsername: 1,
        discordNickname: 1,
        discordProfilePicture: 1,
      })
      .toArray();

    console.log(
      `Found ${players.length} players for search term "${searchTerm}"`
    );

    return NextResponse.json(players);
  } catch (error) {
    console.error("Error searching players:", error);
    return NextResponse.json(
      { error: "Failed to search players" },
      { status: 500 }
    );
  }
}
