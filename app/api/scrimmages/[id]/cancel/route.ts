import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity } from "@/lib/api-wrapper";
import { revalidatePath } from "next/cache";

async function postCancelScrimmageHandler(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = sanitizeString(params.id, 100);
  let scrimmageId: ObjectId | string = id;

  if (ObjectId.isValid(id)) {
    scrimmageId = new ObjectId(id);
  }

  const { db } = await connectToDatabase();

  const scrimmage = await db.collection("Scrimmages").findOne(
    ObjectId.isValid(id)
      ? { _id: scrimmageId as ObjectId }
      : { scrimmageId: id }
  );

    if (!scrimmage) {
      return NextResponse.json(
        { error: "Scrimmage not found" },
        { status: 404 }
      );
    }

    // Verify user is authorized to cancel the scrimmage
    const isAdmin = session.user.roles?.includes("admin");
    const isTeamACaptain =
      session.user.id === scrimmage.challengerTeam?.captain?.discordId;
    const isTeamBCaptain =
      session.user.id === scrimmage.challengedTeam?.captain?.discordId;

    if (!isAdmin && !isTeamACaptain && !isTeamBCaptain) {
      return NextResponse.json(
        { error: "You are not authorized to cancel this scrimmage" },
        { status: 403 }
      );
    }

  await db.collection("Scrimmages").deleteOne(
    ObjectId.isValid(id)
      ? { _id: scrimmageId as ObjectId }
      : { scrimmageId: id }
  );

  revalidatePath("/scrimmages");
  revalidatePath(`/scrimmages/${id}`);

  return NextResponse.json({ success: true, message: "Scrimmage canceled" });
}

export const POST = withApiSecurity(postCancelScrimmageHandler, {
  rateLimiter: "api",
  requireAuth: true,
  revalidatePaths: ["/scrimmages"],
});
