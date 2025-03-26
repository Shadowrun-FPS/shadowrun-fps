import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { db } = await connectToDatabase();
    const data = await request.json();

    console.log("Challenge data received:", data);

    // Validate required fields
    if (!data.challengedTeamId) {
      return NextResponse.json(
        { error: "Missing required fields: challengedTeamId" },
        { status: 400 }
      );
    }

    if (!data.proposedDate) {
      return NextResponse.json(
        { error: "Missing required fields: proposedDate" },
        { status: 400 }
      );
    }

    if (
      !data.selectedMaps ||
      !Array.isArray(data.selectedMaps) ||
      data.selectedMaps.length === 0
    ) {
      return NextResponse.json(
        { error: "Missing required fields: selectedMaps" },
        { status: 400 }
      );
    }

    // Get the user's team
    const userTeam = await db.collection("Teams").findOne({
      "members.discordId": session.user.id,
    });

    if (!userTeam) {
      return NextResponse.json(
        { error: "You must be in a team to challenge another team" },
        { status: 400 }
      );
    }

    // Get the challenged team
    const challengedTeam = await db.collection("Teams").findOne({
      _id: new ObjectId(data.challengedTeamId),
    });

    if (!challengedTeam) {
      return NextResponse.json(
        { error: "Challenged team not found" },
        { status: 404 }
      );
    }

    // Ensure the gameMode is properly stored
    const mapsWithGameMode = data.selectedMaps.map((map: any) => ({
      ...map,
      gameMode: map.gameMode, // Use the gameMode directly from the map
    }));

    console.log("Maps with gameMode:", mapsWithGameMode);

    // Create the scrimmage
    const scrimmage = {
      scrimmageId: uuidv4(),
      challengerTeamId: userTeam._id.toString(),
      challengedTeamId: data.challengedTeamId,
      challengerTeam: {
        _id: userTeam._id,
        name: userTeam.name,
        tag: userTeam.tag,
        logo: userTeam.logo,
        captain: userTeam.captain,
        members: userTeam.members,
      },
      challengedTeam: {
        _id: challengedTeam._id,
        name: challengedTeam.name,
        tag: challengedTeam.tag,
        logo: challengedTeam.logo,
        captain: challengedTeam.captain,
        members: challengedTeam.members,
      },
      proposedDate: new Date(data.proposedDate),
      selectedMaps: mapsWithGameMode, // Use the maps with gameMode
      message: data.message || "",
      status: "pending",
      createdAt: new Date(),
      createdBy: session.user.id,
    };

    const result = await db.collection("Scrimmages").insertOne(scrimmage);

    // Create a notification for the challenged team captain
    if (challengedTeam.captain?.discordId) {
      await db.collection("Notifications").insertOne({
        userId: challengedTeam.captain.discordId,
        type: "scrimmage_challenge",
        title: "New Scrimmage Challenge",
        message: `${userTeam.name} has challenged your team to a scrimmage.`,
        scrimmageId: scrimmage.scrimmageId,
        createdAt: new Date(),
        read: false,
      });
    }

    return NextResponse.json({
      success: true,
      scrimmageId: scrimmage.scrimmageId,
    });
  } catch (error) {
    console.error("Error creating scrimmage challenge:", error);
    return NextResponse.json(
      { error: "Failed to create scrimmage challenge" },
      { status: 500 }
    );
  }
}
