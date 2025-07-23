import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import {
  SECURITY_CONFIG,
  ADMIN_ROLE_IDS,
  MODERATOR_ROLE_IDS,
} from "@/lib/security-config";
import { withErrorHandling, createError } from "@/lib/error-handling";
import { secureLogger } from "@/lib/secure-logger";

// Developer ID for special permissions
const DEVELOPER_ID = SECURITY_CONFIG.DEVELOPER_ID;

// Admin role IDs
const ADMIN_ROLES = ADMIN_ROLE_IDS;

// Moderator role IDs (includes admin roles)
const MOD_ROLES = MODERATOR_ROLE_IDS;

export const PUT = withErrorHandling(
  async (req: NextRequest, { params }: { params: { id: string } }) => {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw createError.unauthorized(
        "Authentication required to edit tournaments"
      );
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
      secureLogger.warn("Unauthorized tournament edit attempt", {
        userId: session.user.id,
        tournamentId: params.id,
      });
      throw createError.forbidden(
        "You don't have permission to edit this tournament"
      );
    }

    const tournamentId = params.id;
    if (!ObjectId.isValid(tournamentId)) {
      throw createError.badRequest("Invalid tournament ID");
    }

    const { db } = await connectToDatabase();

    // Get the tournament data from request body
    const tournamentData = await req.json();

    // Validate required fields
    if (!tournamentData.name || !tournamentData.startDate) {
      throw createError.badRequest("Name and start date are required");
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
      throw createError.notFound("Tournament not found");
    }

    secureLogger.info("Tournament updated successfully", {
      tournamentId,
      adminId: session.user.id,
    });

    return NextResponse.json({
      success: true,
      message: "Tournament updated successfully",
    });
  }
);
