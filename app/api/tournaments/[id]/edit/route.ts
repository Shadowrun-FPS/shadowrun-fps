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

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be logged in to edit a tournament" },
        { status: 401 }
      );
    }

    const { id } = params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid tournament ID" },
        { status: 400 }
      );
    }

    const data = await request.json();

    // Extract editable fields
    const { name, description, startDate, teamSize, maxTeams, format, status } =
      data;

    const client = await clientPromise;
    const db = client.db();

    // Check if tournament exists
    const tournament = await db.collection("Tournaments").findOne({
      _id: new ObjectId(id),
    });

    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }

    // Check if user is admin or tournament creator
    const user = await db.collection("Users").findOne({
      discordId: session.user.id,
    });

    const isAdmin = user?.roles?.includes("admin");
    const isCreator = tournament.createdBy?.discordId === session.user.id;

    if (!isAdmin && !isCreator) {
      return NextResponse.json(
        { error: "You don't have permission to edit this tournament" },
        { status: 403 }
      );
    }

    // Prepare update object with only provided fields
    const updateFields: Record<string, any> = {};
    if (name !== undefined) updateFields.name = name;
    if (description !== undefined) updateFields.description = description;
    if (startDate !== undefined) updateFields.startDate = new Date(startDate);
    if (teamSize !== undefined) updateFields.teamSize = teamSize;
    if (maxTeams !== undefined) updateFields.maxTeams = maxTeams;
    if (format !== undefined) updateFields.format = format;
    if (status !== undefined) updateFields.status = status;

    updateFields.updatedAt = new Date();

    // Update tournament
    const result = await db
      .collection("Tournaments")
      .updateOne({ _id: new ObjectId(id) }, { $set: updateFields });

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "Failed to update tournament" },
        { status: 500 }
      );
    }

    // Fetch updated tournament
    const updatedTournament = await db.collection("Tournaments").findOne({
      _id: new ObjectId(id),
    });

    if (!updatedTournament) {
      return NextResponse.json(
        { error: "Failed to update tournament" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Tournament updated successfully",
      tournament: {
        ...updatedTournament,
        _id: updatedTournament._id.toString(),
      },
    });
  } catch (error) {
    console.error("Error updating tournament:", error);
    return NextResponse.json(
      { error: "Failed to update tournament" },
      { status: 500 }
    );
  }
}
