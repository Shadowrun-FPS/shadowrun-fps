import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import {
  ADMIN_ROLE_IDS,
  MODERATOR_ROLE_IDS,
  SECURITY_CONFIG,
} from "@/lib/security-config";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Get user session
    const session = await getServerSession(authOptions);

    // Check if user has required roles
    const isAuthorized =
      session?.user?.id === SECURITY_CONFIG.DEVELOPER_ID ||
      (session?.user?.roles &&
        (session?.user?.roles.includes("admin") ||
          session?.user?.roles.includes("moderator") ||
          session?.user?.roles.includes("founder")));

    if (!session?.user || !isAuthorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Connect to database
    const { db } = await connectToDatabase();

    // Fetch players from database
    const players = await db.collection("Players").find({}).toArray();

    return NextResponse.json(players);
  } catch (error) {
    console.error("Error fetching players:", error);
    return NextResponse.json(
      { error: "Failed to fetch players" },
      { status: 500 }
    );
  }
}
