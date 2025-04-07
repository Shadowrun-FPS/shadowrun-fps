import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// Developer ID for special permissions
const DEVELOPER_ID = "238329746671271936";

// Admin role IDs
const ADMIN_ROLES = [
  "932585751332421642", // Admin
  "1095126043918082109", // Founder
];

// Moderator role IDs (includes admin roles)
const MOD_ROLES = [
  ...ADMIN_ROLES,
  "1042168064805965864", // Mod
  "1080979865345458256", // GM
];

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin or developer
    const isDeveloper = session.user.id === DEVELOPER_ID;

    // Get user roles from session
    const userRoles = session.user.roles || [];

    // Check if user has admin permissions
    const isAdmin =
      isDeveloper ||
      userRoles.some((role) => ADMIN_ROLES.includes(role)) ||
      userRoles.some((role) => MOD_ROLES.includes(role));

    if (!isAdmin) {
      console.log("User is not admin:", session.user.id, userRoles);
      return NextResponse.json(
        { error: "You don't have permission to edit this tournament" },
        { status: 403 }
      );
    }

    const tournamentId = params.id;
    if (!ObjectId.isValid(tournamentId)) {
      return NextResponse.json(
        { error: "Invalid tournament ID" },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    // Get the tournament data from request body
    const tournamentData = await req.json();

    // Validate required fields
    if (!tournamentData.name || !tournamentData.startDate) {
      return NextResponse.json(
        { error: "Name and start date are required" },
        { status: 400 }
      );
    }

    // Update the tournament
    const result = await db.collection("Tournaments").updateOne(
      { _id: new ObjectId(tournamentId) },
      {
        $set: {
          name: tournamentData.name,
          description: tournamentData.description,
          startDate: tournamentData.startDate,
          teamSize: parseInt(tournamentData.teamSize),
          format: tournamentData.format,
          maxTeams: parseInt(tournamentData.maxTeams || "8"),
          registrationDeadline: tournamentData.registrationDeadline,
          status: tournamentData.status,
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }

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
