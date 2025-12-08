import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ObjectId } from "mongodb";
import { notifyScrimmageResponse, getGuildId } from "@/lib/discord-bot-api";
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity, validateBody } from "@/lib/api-wrapper";
import { revalidatePath } from "next/cache";

async function patchRespondHandler(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json(
      { error: "You must be logged in" },
      { status: 401 }
    );
  }

  const scrimmageId = sanitizeString(params.id, 50);
  const client = await clientPromise;
  const db = client.db();

  const body = await request.json();
  const validation = validateBody(body, {
    response: { type: "string", required: true, maxLength: 20 },
    counterProposedDate: { type: "string", required: false },
    message: { type: "string", required: false, maxLength: 500 },
  });

  if (!validation.valid) {
    return NextResponse.json(
      { error: validation.errors?.join(", ") || "Invalid input" },
      { status: 400 }
    );
  }

  const { response, counterProposedDate, message } = validation.data! as {
    response: string;
    counterProposedDate?: string;
    message?: string;
  };

  if (!["accept", "reject", "counter"].includes(response)) {
    return NextResponse.json(
      { error: "Invalid response type" },
      { status: 400 }
    );
  }

  if (response === "counter" && !counterProposedDate) {
    return NextResponse.json(
      { error: "Counter proposal requires a date" },
      { status: 400 }
    );
  }

    let scrimmage = null;
    if (ObjectId.isValid(scrimmageId)) {
      scrimmage = await db.collection("Scrimmages").findOne({
        _id: new ObjectId(scrimmageId),
      });
    }
    
    if (!scrimmage) {
      scrimmage = await db.collection("Scrimmages").findOne({
        scrimmageId: scrimmageId,
      });
    }

    if (!scrimmage) {
      return NextResponse.json(
        { error: "Scrimmage not found" },
        { status: 404 }
      );
    }

    // Get the challenged team - search across all collections
    const { findTeamAcrossCollections } = await import("@/lib/team-collections");
    const challengedTeamResult = await findTeamAcrossCollections(db, scrimmage.challengedTeamId.toString());
    if (!challengedTeamResult) {
      return NextResponse.json(
        { error: "Challenged team not found" },
        { status: 404 }
      );
    }
    const challengedTeam = challengedTeamResult.team;

    // Check if user is captain of the challenged team
    if (challengedTeam.captain !== session.user.id) {
      return NextResponse.json(
        { error: "Only the team captain can respond to challenges" },
        { status: 403 }
      );
    }

    let updateData: any = {
      updatedAt: new Date(),
      responseMessage: message ? sanitizeString(message, 500) : undefined,
    };

    if (response === "accept") {
      updateData.status = "accepted";
    } else if (response === "reject") {
      updateData.status = "rejected";
    } else if (response === "counter") {
      if (!counterProposedDate) {
        return NextResponse.json(
          { error: "Counter proposal requires a date" },
          { status: 400 }
        );
      }
      updateData.status = "counterProposal";
      updateData.counterProposedDate = new Date(counterProposedDate);
    }

    // Update the scrimmage
    await db
      .collection("Scrimmages")
      .updateOne({ _id: new ObjectId(scrimmageId) }, { $set: updateData });

    // Get the challenger team for notification
    const challengerTeamResult = await findTeamAcrossCollections(db, scrimmage.challengerTeamId.toString());
    const challengerTeam = challengerTeamResult?.team;

    if (challengerTeam) {
      // Create notification for challenger team members
      const responseText =
        response === "accept"
          ? "accepted"
          : response === "reject"
          ? "rejected"
          : "counter-proposed";

      const notifications = challengerTeam.members.map(
        (member: { discordId: string }) => ({
          userId: member.discordId,
          type: "scrimmage_response",
          message: `${sanitizeString(challengedTeam.name, 100)} has ${responseText} your scrimmage challenge`,
          data: {
            scrimmageId: scrimmageId,
            challengedTeamId: challengedTeam._id.toString(),
            challengedTeamName: challengedTeam.name,
            response: response,
          },
          read: false,
          createdAt: new Date(),
        })
      );

      if (notifications.length > 0) {
        await db.collection("Notifications").insertMany(notifications);
      }

      // Send Discord DM notification via bot API (primary method)
      // Change streams will act as fallback if API fails (with duplicate prevention)
      try {
        const guildId = getGuildId();
        const memberIds = challengerTeam.members.map((m: any) => m.discordId);
        await notifyScrimmageResponse(
          scrimmageId,
          scrimmage.challengerTeamId.toString(),
          sanitizeString(challengedTeam.name, 100),
          response as "accept" | "reject" | "counter",
          memberIds,
          updateData.counterProposedDate || undefined,
          updateData.responseMessage,
          guildId
        );
      } catch (error) {
        safeLog.error("Failed to send Discord notification:", error);
      }
    }

    revalidatePath("/scrimmages");
    revalidatePath("/tournaments/scrimmages");

    return NextResponse.json({
      success: true,
      message: "Response sent successfully",
    });
}

export const PATCH = withApiSecurity(patchRespondHandler, {
  rateLimiter: "api",
  requireAuth: true,
  revalidatePaths: ["/scrimmages", "/tournaments/scrimmages"],
});
