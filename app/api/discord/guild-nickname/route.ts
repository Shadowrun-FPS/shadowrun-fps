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

    let guildNickname = null;

    return NextResponse.json({ guildNickname });
  } catch (error) {
    console.error("Error fetching guild nickname:", error);
    return NextResponse.json(
      { error: "Failed to fetch guild nickname" },
      { status: 500 }
    );
  }
}
