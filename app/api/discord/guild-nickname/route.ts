import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";

// Add this line to make the route dynamic
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Get the guild nickname from your Discord integration
    // This is a simplified example - implement your actual Discord API call
    let guildNickname = null;

    // If you have a Discord bot that can fetch guild member data:
    // 1. Connect to your Discord bot API
    // 2. Fetch the guild member with the userId
    // 3. Extract the nickname

    // For now, we'll return null which will fall back to the session nickname

    return NextResponse.json({ guildNickname });
  } catch (error) {
    console.error("Error fetching guild nickname:", error);
    return NextResponse.json(
      { error: "Failed to fetch guild nickname" },
      { status: 500 }
    );
  }
}
