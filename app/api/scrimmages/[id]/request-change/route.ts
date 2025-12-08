import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity, validateBody } from "@/lib/api-wrapper";
import { revalidatePath } from "next/cache";

async function postRequestChangeScrimmageHandler(
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
      newDate: { type: "string", required: false, maxLength: 50 },
      newTime: { type: "string", required: false, maxLength: 50 },
      newMaps: { type: "array", required: false },
      message: { type: "string", required: false, maxLength: 1000 },
    });

    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.errors?.join(", ") || "Invalid input" },
        { status: 400 }
      );
    }

    const { newDate, newTime, newMaps, message } = validation.data! as {
      newDate?: string;
      newTime?: string;
      newMaps?: any[];
      message?: string;
    };

    // Check if there's already a pending change request
    if (
      scrimmage.changeRequest &&
      scrimmage.changeRequest.status === "pending"
    ) {
      return NextResponse.json(
        {
          error:
            "There is already a pending change request for this scrimmage. Please wait for a response before submitting a new request.",
        },
        { status: 400 }
      );
    }

    // Validate the date is not in the past
    const currentDate = new Date();
    const requestedDateTime = newDate ? new Date(newDate) : null;

    if (requestedDateTime) {
      // Set both dates to start of day for comparison
      const currentDateStart = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        currentDate.getDate()
      );

      const requestedDateStart = new Date(
        requestedDateTime.getFullYear(),
        requestedDateTime.getMonth(),
        requestedDateTime.getDate()
      );

      // Only block if the requested date is strictly before today
      if (requestedDateStart < currentDateStart) {
        return NextResponse.json(
          { error: "Cannot request a date in the past" },
          { status: 400 }
        );
      }
    }

    // Verify user is authorized to request changes
    const isAdmin = session.user.roles?.includes("admin");

    // Check if the teams are properly populated
    if (!scrimmage.challengerTeam || !scrimmage.challengedTeam) {
      // If teams aren't populated, fetch them directly
      const { findTeamAcrossCollections } = await import("@/lib/team-collections");
      const challengerTeamResult = await findTeamAcrossCollections(db, scrimmage.challengerTeamId);
      const challengedTeamResult = await findTeamAcrossCollections(db, scrimmage.challengedTeamId);
      
      const challengerTeam = challengerTeamResult?.team;
      const challengedTeam = challengedTeamResult?.team;

      scrimmage.challengerTeam = challengerTeam;
      scrimmage.challengedTeam = challengedTeam;
    }

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


    if (!isAdmin && !isTeamACaptain && !isTeamBCaptain) {
      return NextResponse.json(
        {
          error: "You are not authorized to request changes to this scrimmage",
          userId: session.user.id,
          teamACaptainId: scrimmage.challengerTeam?.captain?.discordId,
          teamBCaptainId: scrimmage.challengedTeam?.captain?.discordId,
        },
        { status: 403 }
      );
    }

    // Determine which team is requesting the change
    const requestingTeam = isTeamACaptain ? "teamA" : "teamB";
    const otherTeam = requestingTeam === "teamA" ? "teamB" : "teamA";
    const otherTeamCaptainId =
      requestingTeam === "teamA"
        ? scrimmage.challengedTeam?.captain?.discordId
        : scrimmage.challengerTeam?.captain?.discordId;

    const requestingTeamName =
      requestingTeam === "teamA"
        ? scrimmage.challengerTeam?.name
        : scrimmage.challengedTeam?.name;

    await db.collection("Scrimmages").updateOne(
      { _id: scrimmage._id },
      {
        $set: {
          changeRequest: {
            requestedBy: session.user.id,
            requestedByTeam: requestingTeam,
            requestedByTeamName: sanitizeString(requestingTeamName || "", 100),
            requestedAt: new Date(),
            newDate: newDate ? sanitizeString(newDate, 50) : null,
            newTime: newTime ? sanitizeString(newTime, 50) : null,
            newMaps: newMaps || null,
            message: message ? sanitizeString(message, 1000) : "",
            status: "pending",
            notifiedOtherTeam: false,
          },
        },
      }
    );

    if (otherTeamCaptainId) {
      await db.collection("Notifications").insertOne({
        userId: sanitizeString(otherTeamCaptainId, 50),
        type: "scrimmage_change_request",
        title: "Scrimmage Change Requested",
        message: sanitizeString(
          `${requestingTeamName} has requested changes to your scheduled scrimmage on ${new Date(
            scrimmage.proposedDate
          ).toLocaleDateString()}.`,
          500
        ),
        scrimmageId: sanitizeString(
          scrimmage.scrimmageId || scrimmage._id.toString(),
          100
        ),
        scrimmageDetails: {
          teamA: sanitizeString(scrimmage.challengerTeam?.name || "", 100),
          teamB: sanitizeString(scrimmage.challengedTeam?.name || "", 100),
          originalDate: scrimmage.proposedDate,
          requestedDate: newDate,
        },
        createdAt: new Date(),
        read: false,
      });
    }

    // Get the updated scrimmage
    const updatedScrimmage = await db.collection("Scrimmages").findOne({
      _id: scrimmage._id,
    });

    revalidatePath("/scrimmages");
    revalidatePath(`/scrimmages/${id}`);

    return NextResponse.json(updatedScrimmage);
}

export const POST = withApiSecurity(postRequestChangeScrimmageHandler, {
  rateLimiter: "api",
  requireAuth: true,
  revalidatePaths: ["/scrimmages"],
});
