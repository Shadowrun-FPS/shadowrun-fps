import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import clientPromise from "@/lib/mongodb";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db("ShadowrunWeb");

    const invites = await db
      .collection("TeamInvites")
      .find({
        invitedId: session.user.id,
        status: "pending",
      })
      .toArray();

    return NextResponse.json(invites);
  } catch (error) {
    console.error("Failed to fetch team invites:", error);
    return NextResponse.json(
      { error: "Failed to fetch team invites" },
      { status: 500 }
    );
  }
}
