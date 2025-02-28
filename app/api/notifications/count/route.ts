import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import clientPromise from "@/lib/mongodb";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ count: 0 });
    }

    const client = await clientPromise;
    const db = client.db("ShadowrunWeb");

    const count = await db.collection("Notifications").countDocuments({
      userId: session.user.id,
      read: false,
    });

    return NextResponse.json({ count });
  } catch (error) {
    console.error("Failed to fetch notification count:", error);
    return NextResponse.json({ count: 0 });
  }
}
