import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity } from "@/lib/api-wrapper";
import { revalidatePath } from "next/cache";

async function postAcceptHandler(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const scrimmageId = sanitizeString(params.id, 50);
  const { db } = await connectToDatabase();

  let scrimmage = null;
  if (ObjectId.isValid(scrimmageId)) {
    try {
      scrimmage = await db.collection("Scrimmages").findOne({
        _id: new ObjectId(scrimmageId),
      });
    } catch (error) {
      // Invalid ObjectId format, continue to next method
    }
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

    // Fetch both teams to validate team sizes and member counts
    const { findTeamAcrossCollections } = await import("@/lib/team-collections");
    const challengedTeamResult = await findTeamAcrossCollections(db, scrimmage.challengedTeamId);
    const challengerTeamResult = await findTeamAcrossCollections(db, scrimmage.challengerTeamId);
    
    const challengedTeam = challengedTeamResult?.team;
    const challengerTeam = challengerTeamResult?.team;

    if (!challengerTeam) {
      return NextResponse.json(
        { error: "Challenger team not found" },
        { status: 404 }
      );
    }

    if (!challengedTeam) {
      return NextResponse.json(
        { error: "Challenged team not found" },
        { status: 404 }
      );
    }

    // Verify user is authorized to accept the scrimmage
    const isAdmin = session.user.roles?.includes("admin");

    // Check if user is captain of challenged team
    const isTeamBCaptain =
      session.user.id === challengedTeam.captain?.discordId;

    if (!isAdmin && !isTeamBCaptain) {
      return NextResponse.json(
        {
          error:
            "Only the challenged team captain or an admin can accept a challenge",
          userId: session.user.id,
          captainId: challengedTeam.captain?.discordId,
        },
        { status: 403 }
      );
    }

    // Validate team sizes still match
    const challengerTeamSize = challengerTeam.teamSize || 4;
    const challengedTeamSize = challengedTeam.teamSize || 4;
    
    if (challengerTeamSize !== challengedTeamSize) {
      return NextResponse.json(
        { 
          error: `Team sizes must match. ${challengerTeam.name} is ${challengerTeamSize}v${challengerTeamSize}, but ${challengedTeam.name} is ${challengedTeamSize}v${challengedTeamSize}.` 
        },
        { status: 400 }
      );
    }

    // Validate both teams are still full
    const challengerTeamMemberCount = challengerTeam.members?.length || 0;
    const challengedTeamMemberCount = challengedTeam.members?.length || 0;
    
    if (challengerTeamMemberCount < challengerTeamSize) {
      return NextResponse.json(
        { 
          error: `${challengerTeam.name} needs ${challengerTeamSize} members to participate in scrimmages (currently has ${challengerTeamMemberCount}).` 
        },
        { status: 400 }
      );
    }
    
    if (challengedTeamMemberCount < challengedTeamSize) {
      return NextResponse.json(
        { 
          error: `${challengedTeam.name} needs ${challengedTeamSize} members to participate in scrimmages (currently has ${challengedTeamMemberCount}).` 
        },
        { status: 400 }
      );
    }

    const updateQuery = scrimmage._id 
      ? { _id: scrimmage._id }
      : { scrimmageId: scrimmageId };

    await db.collection("Scrimmages").updateOne(
      updateQuery,
      {
        $set: {
          status: "accepted",
          acceptedAt: new Date(),
          scrimmageId: scrimmage.scrimmageId || new ObjectId().toString(),
        },
      }
    );

    // Get the updated scrimmage
    const updatedScrimmage = await db.collection("Scrimmages").findOne(updateQuery);

    // Get the challenging team captain's ID for notification
    const challengerCaptainId = scrimmage.challengerTeam?.captain?.discordId;

    // Create a notification for the challenging team captain
    if (challengerCaptainId) {
      await db.collection("Notifications").insertOne({
        userId: challengerCaptainId,
        type: "scrimmage_accepted",
        title: "Scrimmage Challenge Accepted",
        message: `${sanitizeString(scrimmage.challengedTeam?.name || "", 100)} has accepted your scrimmage challenge for ${new Date(
          scrimmage.proposedDate
        ).toLocaleDateString()}.`,
        scrimmageId: scrimmage.scrimmageId || scrimmage._id.toString(),
        scrimmageDetails: {
          teamA: scrimmage.challengerTeam?.name,
          teamB: scrimmage.challengedTeam?.name,
          date: scrimmage.proposedDate,
          maps: scrimmage.maps,
        },
        createdAt: new Date(),
        read: false,
      });
    }

    revalidatePath("/scrimmages");
    revalidatePath("/tournaments/scrimmages");

    return NextResponse.json(updatedScrimmage);
}

export const POST = withApiSecurity(postAcceptHandler, {
  rateLimiter: "api",
  requireAuth: true,
  revalidatePaths: ["/scrimmages", "/tournaments/scrimmages"],
});
