import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("User session ID:", session.user.id);

    const { db } = await connectToDatabase();

    // Try to find the scrimmage by _id first
    let scrimmage = null;
    try {
      scrimmage = await db.collection("Scrimmages").findOne({
        _id: new ObjectId(params.id),
      });
    } catch (error) {
      // If ObjectId conversion fails, it's not a valid ObjectId
      console.log("Not a valid ObjectId, trying scrimmageId");
    }

    // If not found by _id, try to find by scrimmageId
    if (!scrimmage) {
      scrimmage = await db.collection("Scrimmages").findOne({
        scrimmageId: params.id,
      });
    }

    if (!scrimmage) {
      return NextResponse.json(
        { error: "Scrimmage not found" },
        { status: 404 }
      );
    }

    // Log the scrimmage data to debug
    console.log("Scrimmage found:", {
      id: scrimmage._id,
      scrimmageId: scrimmage.scrimmageId,
      challengerTeamCaptain: scrimmage.challengerTeam?.captain?.discordId,
      challengedTeamCaptain: scrimmage.challengedTeam?.captain?.discordId,
    });

    // Get request data
    const data = await request.json();
    const { newDate, message } = data;

    // Verify user is authorized to request changes
    const isAdmin = session.user.roles?.includes("admin");

    // Check if the teams are properly populated
    if (!scrimmage.challengerTeam || !scrimmage.challengedTeam) {
      // If teams aren't populated, fetch them directly
      const challengerTeam = await db.collection("Teams").findOne({
        _id: new ObjectId(scrimmage.challengerTeamId),
      });

      const challengedTeam = await db.collection("Teams").findOne({
        _id: new ObjectId(scrimmage.challengedTeamId),
      });

      scrimmage.challengerTeam = challengerTeam;
      scrimmage.challengedTeam = challengedTeam;

      console.log("Teams fetched directly:", {
        challengerTeamCaptain: challengerTeam?.captain?.discordId,
        challengedTeamCaptain: challengedTeam?.captain?.discordId,
      });
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

    console.log("Enhanced authorization check:", {
      isAdmin,
      isTeamACaptain,
      isTeamBCaptain,
      sessionUserId: session.user.id,
      challengerCaptainId: scrimmage.challengerTeam?.captain?.discordId,
      challengedCaptainId: scrimmage.challengedTeam?.captain?.discordId,
      challengerTeamMembers: scrimmage.challengerTeam?.members?.map(
        (m: any) => ({
          id: m.discordId,
          role: m.role,
        })
      ),
      challengedTeamMembers: scrimmage.challengedTeam?.members?.map(
        (m: any) => ({
          id: m.discordId,
          role: m.role,
        })
      ),
    });

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

    // Update the scrimmage with change request
    await db.collection("Scrimmages").updateOne(
      { _id: scrimmage._id },
      {
        $set: {
          changeRequest: {
            requestedBy: session.user.id,
            requestedByTeam: requestingTeam,
            requestedAt: new Date(),
            newDate: newDate || null,
            message: message || "",
            status: "pending",
            notifiedOtherTeam: false,
          },
        },
      }
    );

    // Create a notification for the other team captain
    if (otherTeamCaptainId) {
      await db.collection("Notifications").insertOne({
        userId: otherTeamCaptainId,
        type: "scrimmage_change_request",
        title: "Scrimmage Change Requested",
        message: `The other team has requested changes to your scheduled scrimmage.`,
        scrimmageId: scrimmage.scrimmageId || scrimmage._id.toString(),
        createdAt: new Date(),
        read: false,
      });
    }

    // Get the updated scrimmage
    const updatedScrimmage = await db.collection("Scrimmages").findOne({
      _id: scrimmage._id,
    });

    return NextResponse.json(updatedScrimmage);
  } catch (error) {
    console.error("Error requesting change:", error);
    return NextResponse.json(
      { error: "Failed to request change" },
      { status: 500 }
    );
  }
}
