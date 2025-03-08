export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Connect to database
    const { db } = await connectToDatabase();

    // Get all tournaments
    const tournaments = await db.collection("Tournaments").find({}).toArray();

    // Convert MongoDB _id to string
    const formattedTournaments = tournaments.map((tournament) => ({
      ...tournament,
      _id: tournament._id.toString(),
    }));

    return NextResponse.json({
      tournaments: formattedTournaments,
    });
  } catch (error) {
    console.error("Error fetching tournaments:", error);
    return NextResponse.json(
      { error: "Failed to fetch tournaments" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated
    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be signed in to create a tournament" },
        { status: 401 }
      );
    }

    // Check if user has the required roles
    const hasRequiredRole =
      session.user.id === "238329746671271936" || // Your ID
      (session.user.roles &&
        (session.user.roles.includes("admin") ||
          session.user.roles.includes("moderator") ||
          session.user.roles.includes("founder")));

    if (!hasRequiredRole) {
      return NextResponse.json(
        { error: "You don't have permission to create tournaments" },
        { status: 403 }
      );
    }

    // Get request body
    const data = await req.json();

    // Validate required fields
    if (!data.name || !data.type || !data.startDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Connect to database
    const { db } = await connectToDatabase();

    // Create tournament object
    const tournament = {
      name: data.name,
      type: data.type,
      startDate: data.startDate,
      prizePool: data.prizePool || "$0",
      maxTeams: data.maxTeams || 16,
      teams: 0,
      registrationDeadline: data.registrationDeadline || data.startDate,
      status: "Registration Open",
      createdAt: new Date().toISOString(),
      createdBy: {
        discordId: session.user.id,
        discordUsername: session.user.name || "",
        discordNickname: session.user.nickname || session.user.name || "",
      },
      participants: [],
    };

    // Insert tournament into database
    const result = await db.collection("Tournaments").insertOne(tournament);

    return NextResponse.json({
      success: true,
      message: "Tournament created successfully",
      tournamentId: result.insertedId,
    });
  } catch (error) {
    console.error("Error creating tournament:", error);
    return NextResponse.json(
      { error: "Failed to create tournament" },
      { status: 500 }
    );
  }
}
