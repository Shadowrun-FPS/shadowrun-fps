import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity, validateBody } from "@/lib/api-wrapper";
import { revalidatePath } from "next/cache";

async function postRespondChangeScrimmageHandler(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = sanitizeString(params.id, 100);
  if (!ObjectId.isValid(id)) {
    return NextResponse.json(
      { error: "Invalid scrimmage ID" },
      { status: 400 }
    );
  }

  const body = await request.json();
  const validation = validateBody(body, {
    response: { type: "string", required: true, maxLength: 10 },
    requestId: { type: "string", required: true, maxLength: 50 },
  });

  if (!validation.valid) {
    return NextResponse.json(
      { error: validation.errors?.join(", ") || "Invalid input" },
      { status: 400 }
    );
  }

  const { response, requestId } = validation.data! as {
    response: string;
    requestId: string;
  };

  if (!["accept", "reject"].includes(response)) {
    return NextResponse.json({ error: "Invalid response" }, { status: 400 });
  }

  const sanitizedRequestId = sanitizeString(requestId, 50);
  if (!ObjectId.isValid(sanitizedRequestId)) {
    return NextResponse.json(
      { error: "Invalid request ID" },
      { status: 400 }
    );
  }

  const { db } = await connectToDatabase();

  const scrimmage = await db.collection("scrimmages").findOne({
    _id: new ObjectId(id),
  });

    if (!scrimmage) {
      return NextResponse.json(
        { error: "Scrimmage not found" },
        { status: 404 }
      );
    }

    // Verify user is authorized to respond to changes
    const isTeamACaptain =
      session.user.id === scrimmage.challengingTeam?.captain?.discordId;
    const isTeamBCaptain =
      session.user.id === scrimmage.challengedTeam?.captain?.discordId;

    if (!isTeamACaptain && !isTeamBCaptain) {
      return NextResponse.json(
        { error: "Only team captains can respond to change requests" },
        { status: 403 }
      );
    }

    const changeRequest = scrimmage.changeRequests?.find(
      (req: any) => req._id.toString() === sanitizedRequestId
    );

    if (!changeRequest) {
      return NextResponse.json(
        { error: "Change request not found" },
        { status: 404 }
      );
    }

    // Make sure the responding captain is not the one who made the request
    const requestedByTeam = changeRequest.requestedByTeam;
    const respondingTeam = isTeamACaptain ? "teamA" : "teamB";

    if (requestedByTeam === respondingTeam) {
      return NextResponse.json(
        { error: "You cannot respond to your own change request" },
        { status: 400 }
      );
    }

    await db.collection("scrimmages").updateOne(
      {
        _id: new ObjectId(id),
        "changeRequests._id": new ObjectId(sanitizedRequestId),
      },
      {
        $set: {
          "changeRequests.$.status": response,
          "changeRequests.$.respondedAt": new Date(),
          "changeRequests.$.respondedBy": session.user.id,
        },
      }
    );

    // If accepted, update the scrimmage with the new details
    if (response === "accept") {
      const updateData: any = { hasActiveChangeRequest: false };

      if (changeRequest.proposedDate) {
        updateData.proposedDate = changeRequest.proposedDate;
      }

      if (changeRequest.proposedMaps) {
        updateData.maps = changeRequest.proposedMaps;
      }

      await db
        .collection("scrimmages")
        .updateOne({ _id: new ObjectId(id) }, { $set: updateData });
    } else {
      await db
        .collection("scrimmages")
        .updateOne(
          { _id: new ObjectId(id) },
          { $set: { hasActiveChangeRequest: false } }
        );
    }

    const updatedScrimmage = await db.collection("scrimmages").findOne({
      _id: new ObjectId(id),
    });

    revalidatePath("/scrimmages");
    revalidatePath(`/scrimmages/${id}`);

    return NextResponse.json(updatedScrimmage);
}

export const POST = withApiSecurity(postRespondChangeScrimmageHandler, {
  rateLimiter: "api",
  requireAuth: true,
  revalidatePaths: ["/scrimmages"],
});
