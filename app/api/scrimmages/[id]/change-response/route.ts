import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity, validateBody } from "@/lib/api-wrapper";
import { revalidatePath } from "next/cache";

async function postChangeResponseScrimmageHandler(
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
    try {
      scrimmage = await db.collection("Scrimmages").findOne({
        _id: new ObjectId(id),
      });
    } catch (error) {
      safeLog.log("Not a valid ObjectId, trying scrimmageId");
    }
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

    const body = await request.json();
    const validation = validateBody(body, {
      accept: { type: "boolean", required: true },
    });

    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.errors?.join(", ") || "Invalid input" },
        { status: 400 }
      );
    }

    const { accept } = validation.data! as { accept: boolean };

    // Verify user is authorized to respond to change request
    const isAdmin = session.user.roles?.includes("admin");
    const isTeamACaptain =
      session.user.id === scrimmage.challengerTeam?.captain?.discordId ||
      scrimmage.challengerTeam?.members?.some(
        (member: any) =>
          member.discordId === session.user.id && member.role === "captain"
      );
    const isTeamBCaptain =
      session.user.id === scrimmage.challengedTeam?.captain?.discordId ||
      scrimmage.challengedTeam?.members?.some(
        (member: any) =>
          member.discordId === session.user.id && member.role === "captain"
      );

    // Check if the user is from the team that didn't request the change
    const requestedByTeam = scrimmage.changeRequest?.requestedByTeam;
    const isOtherTeamCaptain =
      (isTeamACaptain && requestedByTeam === "teamB") ||
      (isTeamBCaptain && requestedByTeam === "teamA");

    if (!isAdmin && !isOtherTeamCaptain) {
      return NextResponse.json(
        { error: "You are not authorized to respond to this change request" },
        { status: 403 }
      );
    }

    // Get the requesting team captain ID for notification
    const requestingTeamCaptainId =
      requestedByTeam === "teamA"
        ? scrimmage.challengerTeam?.captain?.discordId
        : scrimmage.challengedTeam?.captain?.discordId;

    if (accept) {
      // Apply the requested changes
      const updateData: any = {
        "changeRequest.status": "accepted",
        "changeRequest.respondedAt": new Date(),
        "changeRequest.respondedBy": session.user.id,
      };

      // If there's a new date, update the proposedDate
      if (scrimmage.changeRequest?.newDate) {
        updateData.proposedDate = scrimmage.changeRequest.newDate;
      }

      // If there's a new time and no new date, combine with existing date
      if (scrimmage.changeRequest?.newTime && !scrimmage.changeRequest?.newDate) {
        const existingDate = new Date(scrimmage.proposedDate);
        const [hours, minutes] = scrimmage.changeRequest.newTime.split(":").map(Number);
        existingDate.setHours(hours, minutes, 0, 0);
        updateData.proposedDate = existingDate;
      }

      // If there are new maps, update selectedMaps
      if (scrimmage.changeRequest?.newMaps && Array.isArray(scrimmage.changeRequest.newMaps)) {
        updateData.selectedMaps = scrimmage.changeRequest.newMaps;
      }

      await db
        .collection("Scrimmages")
        .updateOne({ _id: scrimmage._id }, { $set: updateData });

      if (requestingTeamCaptainId) {
        await db.collection("Notifications").insertOne({
          userId: sanitizeString(requestingTeamCaptainId, 50),
          type: "scrimmage_change_accepted",
          title: "Scrimmage Change Accepted",
          message: sanitizeString("Your requested changes to the scrimmage have been accepted.", 500),
          scrimmageId: sanitizeString(scrimmage.scrimmageId || scrimmage._id.toString(), 100),
          createdAt: new Date(),
          read: false,
        });
      }
    } else {
      // Reject the change request
      await db.collection("Scrimmages").updateOne(
        { _id: scrimmage._id },
        {
          $set: {
            "changeRequest.status": "rejected",
            "changeRequest.respondedAt": new Date(),
            "changeRequest.respondedBy": session.user.id,
          },
        }
      );

      if (requestingTeamCaptainId) {
        await db.collection("Notifications").insertOne({
          userId: sanitizeString(requestingTeamCaptainId, 50),
          type: "scrimmage_change_rejected",
          title: "Scrimmage Change Rejected",
          message: sanitizeString("Your requested changes to the scrimmage have been rejected.", 500),
          scrimmageId: sanitizeString(scrimmage.scrimmageId || scrimmage._id.toString(), 100),
          createdAt: new Date(),
          read: false,
        });
      }
    }

    // Get the updated scrimmage
    const updatedScrimmage = await db.collection("Scrimmages").findOne({
      _id: scrimmage._id,
    });

    revalidatePath("/scrimmages");
    revalidatePath(`/scrimmages/${id}`);

    return NextResponse.json(updatedScrimmage);
}

export const POST = withApiSecurity(postChangeResponseScrimmageHandler, {
  rateLimiter: "api",
  requireAuth: true,
  revalidatePaths: ["/scrimmages"],
});
