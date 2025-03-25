import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated
    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be logged in" },
        { status: 401 }
      );
    }

    // Allow admin by ID or role
    const isAdmin =
      session.user.roles?.includes("admin") ||
      session.user.id === "238329746671271936"; // Your admin ID

    if (!isAdmin) {
      console.log("User lacks permission:", session.user);
      return NextResponse.json(
        { error: "You don't have permission to edit this tournament" },
        { status: 403 }
      );
    }

    const tournamentId = params.id;
    const body = await request.json();

    // Validate input
    if (!body.name) {
      return NextResponse.json(
        { error: "Tournament name is required" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    // Check if tournament exists
    const tournament = await db.collection("Tournaments").findOne({
      _id: new ObjectId(tournamentId),
    });

    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }

    // Update fields
    const updateData = {
      name: body.name,
      description: body.description,
      startDate: body.startDate,
      teamSize: body.teamSize,
      format: body.format,
      maxTeams: body.maxTeams || 0,
    };

    // Update the tournament
    await db
      .collection("Tournaments")
      .updateOne({ _id: new ObjectId(tournamentId) }, { $set: updateData });

    return NextResponse.json({
      success: true,
      message: "Tournament updated successfully",
    });
  } catch (error) {
    console.error("Error updating tournament:", error);
    return NextResponse.json(
      { error: "Failed to update tournament" },
      { status: 500 }
    );
  }
}
