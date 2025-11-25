export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { connectToDatabase } from "@/lib/mongodb";
import { SECURITY_CONFIG } from "@/lib/security-config";

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
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is an admin
    // Use the isAdmin property from the session
    if (!session.user.isAdmin) {
      // Special case for your account specifically
      if (session.user.id !== SECURITY_CONFIG.DEVELOPER_ID) {
        return NextResponse.json(
          { error: "Only administrators can create tournaments" },
          { status: 403 }
        );
      }
    }

    const { db } = await connectToDatabase();
    const data = await request.json();

    // Validate required fields
    const requiredFields = ["name", "format", "teamSize", "maxTeams"];
    for (const field of requiredFields) {
      if (!data[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Create the tournament
    const tournamentData = {
      ...data,
      status: "upcoming",
      createdAt: new Date(),
      createdBy: {
        userId: session.user.id,
        name: session.user.name,
      },
      teams: [],
      brackets: {
        rounds: [],
      },
      coHosts: data.coHosts || [], // Include co-hosts if provided
    };

    // If double elimination format, add losers bracket
    if (data.format === "double_elimination") {
      tournamentData.brackets.losersRounds = [];
    }

    const result = await db.collection("Tournaments").insertOne(tournamentData);

    return NextResponse.json({
      success: true,
      tournamentId: result.insertedId,
      message: "Tournament created successfully",
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
