import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ObjectId } from "mongodb";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be logged in" },
        { status: 401 }
      );
    }

    const data = await request.json();
    const {
      challengerTeamId,
      challengedTeamId,
      proposedDate,
      selectedMaps,
      message,
    } = data;

    if (
      !challengerTeamId ||
      !challengedTeamId ||
      !proposedDate ||
      !selectedMaps
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    // Get the challenger team
    const challengerTeam = await db.collection("Teams").findOne({
      _id: new ObjectId(challengerTeamId),
    });

    if (!challengerTeam) {
      return NextResponse.json(
        { error: "Challenger team not found" },
        { status: 404 }
      );
    }

    // Check if user is the captain of the challenger team
    if (challengerTeam.captain?.discordId !== session.user.id) {
      return NextResponse.json(
        { error: "Only team captains can send challenges" },
        { status: 403 }
      );
    }

    // Get the challenged team
    const challengedTeam = await db.collection("Teams").findOne({
      _id: new ObjectId(challengedTeamId),
    });

    if (!challengedTeam) {
      return NextResponse.json(
        { error: "Challenged team not found" },
        { status: 404 }
      );
    }

    // Check if both teams have enough members
    if (challengerTeam.members.length < 4) {
      return NextResponse.json(
        { error: "Your team must have at least 4 members to challenge" },
        { status: 400 }
      );
    }

    if (challengedTeam.members.length < 4) {
      return NextResponse.json(
        { error: "You can only challenge teams with at least 4 members" },
        { status: 400 }
      );
    }

    // Create the scrimmage challenge with team names and captain info
    const result = await db.collection("Scrimmages").insertOne({
      challengerTeamId: new ObjectId(challengerTeamId),
      challengedTeamId: new ObjectId(challengedTeamId),
      // Store team names for easier access
      challengerTeam: {
        _id: challengerTeam._id,
        name: challengerTeam.name,
        tag: challengerTeam.tag || "",
      },
      challengedTeam: {
        _id: challengedTeam._id,
        name: challengedTeam.name,
        tag: challengedTeam.tag || "",
      },
      // Store captain info
      challengerCaptain: {
        discordId: challengerTeam.captain.discordId,
        discordUsername: challengerTeam.captain.discordUsername || "",
        discordNickname: challengerTeam.captain.discordNickname || "",
        discordAvatar: challengerTeam.captain.discordAvatar || "",
      },
      proposedDate: new Date(proposedDate),
      selectedMaps,
      message,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
      notifiedAt: new Date(),
    });

    // Create notifications for all members of the challenged team
    const notifications = challengedTeam.members.map(
      (member: { discordId: string }) => ({
        userId: member.discordId,
        type: "scrimmage_challenge",
        message: `${challengerTeam.name} has challenged your team to a scrimmage match`,
        data: {
          scrimmageId: result.insertedId.toString(),
          challengerTeamId: challengerTeamId,
          challengerTeamName: challengerTeam.name,
        },
        read: false,
        createdAt: new Date(),
      })
    );

    if (notifications.length > 0) {
      await db.collection("Notifications").insertMany(notifications);
    }

    // Return the created scrimmage
    return NextResponse.json({
      _id: result.insertedId,
      challengerTeamId,
      challengedTeamId,
      proposedDate,
      selectedMaps,
      message,
      status: "pending",
    });
  } catch (error) {
    console.error("Error creating scrimmage challenge:", error);
    return NextResponse.json(
      { error: "Failed to create challenge" },
      { status: 500 }
    );
  }
}
