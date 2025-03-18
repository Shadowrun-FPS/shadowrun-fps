export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(request: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db();

    const tournaments = await db
      .collection("Tournaments")
      .find({})
      .sort({ startDate: -1 })
      .toArray();

    // Convert ObjectId to string
    const formattedTournaments = tournaments.map((tournament) => ({
      ...tournament,
      _id: tournament._id.toString(),
    }));

    return NextResponse.json(formattedTournaments);
  } catch (error) {
    console.error("Error fetching tournaments:", error);
    return NextResponse.json(
      { error: "Failed to fetch tournaments" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated and has admin permissions
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be logged in to create a tournament" },
        { status: 401 }
      );
    }

    // Check if user is admin
    const client = await clientPromise;
    const db = client.db();

    const user = await db.collection("Users").findOne({
      discordId: session.user.id,
    });

    const isAdmin = user?.roles?.includes("admin") || false;

    // If not admin, forbid access
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Only administrators can create tournaments" },
        { status: 403 }
      );
    }

    const data = await request.json();

    // Validate required fields
    if (!data.name || !data.format || !data.teamSize || !data.startDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create tournament document with proper typing and discord user info
    const tournament: {
      name: string;
      description: string;
      format: string;
      teamSize: number;
      maxTeams: number;
      startDate: Date;
      registrationDeadline: Date;
      status: string;
      createdAt: Date;
      createdBy: {
        discordId: string;
        discordUsername: string;
        discordNickname?: string;
      };
      teams: any[];
      brackets: {
        rounds: any[];
        losersRounds?: any[];
      };
      registeredTeams: any[];
    } = {
      name: data.name,
      description: data.description || "",
      format: data.format,
      teamSize: data.teamSize,
      maxTeams: data.maxTeams || 8,
      startDate: new Date(data.startDate),
      registrationDeadline: data.registrationDeadline
        ? new Date(data.registrationDeadline)
        : new Date(data.startDate),
      status: data.status || "upcoming",
      createdAt: new Date(),
      createdBy: {
        discordId: session.user.id,
        discordUsername: session.user.name || "Unknown",
        discordNickname: user?.nickname || undefined,
      },
      teams: [],
      brackets: {
        rounds: [],
      },
      registeredTeams: [],
    };

    // Add losers bracket for double elimination
    if (data.format === "double_elimination") {
      tournament.brackets.losersRounds = [];
    }

    const result = await db.collection("Tournaments").insertOne(tournament);

    // Return the created tournament with string ID
    return NextResponse.json({
      ...tournament,
      _id: result.insertedId.toString(),
    });
  } catch (error) {
    console.error("Error creating tournament:", error);
    return NextResponse.json(
      { error: "Failed to create tournament" },
      { status: 500 }
    );
  }
}

// DELETE a tournament
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be logged in to delete a tournament" },
        { status: 401 }
      );
    }

    // Check if user is admin
    const client = await clientPromise;
    const db = client.db();

    const user = await db.collection("Users").findOne({
      discordId: session.user.id,
    });

    const isAdmin = user?.roles?.includes("admin") || false;

    // If not admin, forbid access
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Only administrators can delete tournaments" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid tournament ID" },
        { status: 400 }
      );
    }

    const result = await db.collection("Tournaments").deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Tournament successfully deleted",
    });
  } catch (error) {
    console.error("Error deleting tournament:", error);
    return NextResponse.json(
      { error: "Failed to delete tournament" },
      { status: 500 }
    );
  }
}
