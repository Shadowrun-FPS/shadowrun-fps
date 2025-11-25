import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ObjectId } from "mongodb";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be logged in" },
        { status: 401 }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    const scrimmageId = params.id;
    const { response, counterProposedDate, message } = await request.json();

    // Validate inputs
    if (!response || !["accept", "reject", "counter"].includes(response)) {
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

    // Get the scrimmage
    const scrimmage = await db.collection("Scrimmages").findOne({
      _id: new ObjectId(scrimmageId),
    });

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

    // Update scrimmage based on response
    let updateData: any = {
      updatedAt: new Date(),
      responseMessage: message || undefined,
    };

    if (response === "accept") {
      updateData.status = "accepted";
    } else if (response === "reject") {
      updateData.status = "rejected";
    } else if (response === "counter") {
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
          message: `${challengedTeam.name} has ${responseText} your scrimmage challenge`,
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
    }

    return NextResponse.json({
      success: true,
      message: "Response sent successfully",
    });
  } catch (error) {
    console.error("Error responding to scrimmage challenge:", error);
    return NextResponse.json(
      { error: "Failed to respond to challenge" },
      { status: 500 }
    );
  }
}
