import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ObjectId } from "mongodb";
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity } from "@/lib/api-wrapper";
import { revalidatePath } from "next/cache";

async function postResendScrimmageHandler(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json(
      { error: "You must be signed in to resend a challenge" },
      { status: 401 }
    );
  }

  const id = sanitizeString(params.id, 100);
  if (!ObjectId.isValid(id)) {
    return NextResponse.json(
      { error: "Invalid scrimmage ID" },
      { status: 400 }
    );
  }

  const client = await clientPromise;
  const db = client.db();

  const scrimmage = await db.collection("scrimmages").findOne({
    _id: new ObjectId(id),
  });

    if (!scrimmage) {
      return NextResponse.json(
        { error: "Scrimmage not found" },
        { status: 404 }
      );
    }

    // Check if the user is the captain of the challenger team
    const userTeam = await db.collection("teams").findOne({
      "captain.discordId": session.user.id,
    });

    if (!userTeam) {
      return NextResponse.json(
        { error: "You must be a team captain to resend a challenge" },
        { status: 403 }
      );
    }

    if (scrimmage.challengerTeamId.toString() !== userTeam._id.toString()) {
      return NextResponse.json(
        { error: "You can only resend challenges from your own team" },
        { status: 403 }
      );
    }

  await db
    .collection("scrimmages")
    .updateOne(
      { _id: new ObjectId(id) },
      { $set: { status: "pending", updatedAt: new Date() } }
    );

  revalidatePath("/scrimmages");
  revalidatePath(`/scrimmages/${id}`);

  return NextResponse.json(
    { message: "Challenge resent successfully" },
    { status: 200 }
  );
}

export const POST = withApiSecurity(postResendScrimmageHandler, {
  rateLimiter: "api",
  requireAuth: true,
  revalidatePaths: ["/scrimmages"],
});
