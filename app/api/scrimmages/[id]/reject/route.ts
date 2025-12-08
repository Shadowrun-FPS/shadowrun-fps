import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity } from "@/lib/api-wrapper";
import { revalidatePath } from "next/cache";

async function postRejectScrimmageHandler(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = sanitizeString(params.id, 100);
  const { db } = await connectToDatabase();

  let scrimmage = null;
  if (ObjectId.isValid(id)) {
    scrimmage = await db.collection("Scrimmages").findOne({
      _id: new ObjectId(id),
    });
  }

  if (!scrimmage) {
    scrimmage = await db.collection("Scrimmages").findOne({
      scrimmageId: id,
    });
  }

    if (!scrimmage) {
      return NextResponse.json(
        { error: "Scrimmage not found" },
        { status: 404 }
      );
    }

    // Verify user is authorized to reject the scrimmage
    const isAdmin = session.user.roles?.includes("admin");
    const isTeamBCaptain =
      session.user.id === scrimmage.challengedTeam?.captain?.discordId;

    if (!isAdmin && !isTeamBCaptain) {
      return NextResponse.json(
        {
          error:
            "Only the challenged team captain or an admin can reject a challenge",
        },
        { status: 403 }
      );
    }

  const updateQuery = ObjectId.isValid(id)
    ? { _id: new ObjectId(id) }
    : { scrimmageId: id };

  await db.collection("Scrimmages").updateOne(updateQuery, {
    $set: {
      status: "rejected",
      rejectedAt: new Date(),
    },
  });

  const updatedScrimmage = await db.collection("Scrimmages").findOne(updateQuery);

  revalidatePath("/scrimmages");
  revalidatePath(`/scrimmages/${id}`);

  return NextResponse.json(updatedScrimmage);
}

export const POST = withApiSecurity(postRejectScrimmageHandler, {
  rateLimiter: "api",
  requireAuth: true,
  revalidatePaths: ["/scrimmages"],
});
