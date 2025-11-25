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
import { canManageTournament } from "@/lib/tournament-permissions";

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

    const { db } = await connectToDatabase();

    // Get the existing tournament to check permissions
    const existingTournament = await db
      .collection("Tournaments")
      .findOne({ _id: new ObjectId(params.id) });

    if (!existingTournament) {
      throw createError.notFound("Tournament not found");
    }

    // Check if user can manage this tournament (admin, creator, or co-host)
    const userRoles = session.user.roles || [];
    if (!canManageTournament(session.user.id, userRoles, existingTournament as any)) {
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

    // Get the tournament data from request body
    const tournamentData = await req.json();

    // Validate required fields
    if (!tournamentData.name || !tournamentData.startDate) {
      throw createError.badRequest("Name and start date are required");
    }

    // Prevent format changes if tournament is launched (not "upcoming")
    if (
      existingTournament.status !== "upcoming" &&
      existingTournament.format !== tournamentData.format
    ) {
      throw createError.badRequest(
        "Tournament format cannot be changed after the tournament is launched"
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
          coHosts: tournamentData.coHosts || existingTournament.coHosts || [],
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
