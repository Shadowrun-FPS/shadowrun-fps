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
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity, validateBody } from "@/lib/api-wrapper";
import { revalidatePath } from "next/cache";

// Developer ID for special permissions
const DEVELOPER_ID = SECURITY_CONFIG.DEVELOPER_ID;

// Admin role IDs
const ADMIN_ROLES = ADMIN_ROLE_IDS;

// Moderator role IDs (includes admin roles)
const MOD_ROLES = MODERATOR_ROLE_IDS;

async function putEditTournamentHandler(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json(
      { error: "Authentication required to edit tournaments" },
      { status: 401 }
    );
  }

  const tournamentId = sanitizeString(params.id, 50);
  if (!ObjectId.isValid(tournamentId)) {
    return NextResponse.json(
      { error: "Invalid tournament ID" },
      { status: 400 }
    );
  }

  const { db } = await connectToDatabase();

  const existingTournament = await db
    .collection("Tournaments")
    .findOne({ _id: new ObjectId(tournamentId) });

  if (!existingTournament) {
    return NextResponse.json(
      { error: "Tournament not found" },
      { status: 404 }
    );
  }

  const userRoles = session.user.roles || [];
  if (!canManageTournament(session.user.id, userRoles, existingTournament as any)) {
    secureLogger.warn("Unauthorized tournament edit attempt", {
      userId: session.user.id,
      tournamentId,
    });
    return NextResponse.json(
      { error: "You don't have permission to edit this tournament" },
      { status: 403 }
    );
  }

  const body = await req.json();
  const validation = validateBody(body, {
    name: { type: "string", required: true, maxLength: 200 },
    description: { type: "string", required: false, maxLength: 5000 },
    startDate: { type: "string", required: true, maxLength: 50 },
    teamSize: { type: "number", required: false, min: 2, max: 5 },
    format: { type: "string", required: false, maxLength: 50 },
    maxTeams: { type: "number", required: false, min: 2, max: 128 },
    registrationDeadline: { type: "string", required: false, maxLength: 50 },
    status: { type: "string", required: false, maxLength: 50 },
    coHosts: { type: "array", required: false },
  });

  if (!validation.valid) {
    return NextResponse.json(
      { error: validation.errors?.join(", ") || "Invalid input" },
      { status: 400 }
    );
  }

  const tournamentData = validation.data! as {
    name: string;
    description?: string;
    startDate: string;
    teamSize?: number;
    format?: string;
    maxTeams?: number;
    registrationDeadline?: string;
    status?: string;
    coHosts?: any[];
  };

    // Prevent format changes if tournament is launched (not "upcoming")
    if (
      existingTournament.status !== "upcoming" &&
      existingTournament.format !== tournamentData.format
    ) {
      throw createError.badRequest(
        "Tournament format cannot be changed after the tournament is launched"
      );
    }

    if (
      existingTournament.status !== "upcoming" &&
      existingTournament.format !== tournamentData.format
    ) {
      return NextResponse.json(
        { error: "Tournament format cannot be changed after the tournament is launched" },
        { status: 400 }
      );
    }

    const result = await db.collection("Tournaments").updateOne(
      { _id: new ObjectId(tournamentId) },
      {
        $set: {
          name: sanitizeString(tournamentData.name, 200),
          description: tournamentData.description ? sanitizeString(tournamentData.description, 5000) : undefined,
          startDate: sanitizeString(tournamentData.startDate, 50),
          teamSize: tournamentData.teamSize ? parseInt(String(tournamentData.teamSize)) : undefined,
          format: tournamentData.format ? sanitizeString(tournamentData.format, 50) : undefined,
          maxTeams: tournamentData.maxTeams ? parseInt(String(tournamentData.maxTeams)) : undefined,
          registrationDeadline: tournamentData.registrationDeadline ? sanitizeString(tournamentData.registrationDeadline, 50) : undefined,
          status: tournamentData.status ? sanitizeString(tournamentData.status, 50) : undefined,
          coHosts: tournamentData.coHosts || existingTournament.coHosts || [],
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

    secureLogger.info("Tournament updated successfully", {
      tournamentId,
      adminId: session.user.id,
    });

    revalidatePath("/tournaments");
    revalidatePath(`/tournaments/${tournamentId}`);

    return NextResponse.json({
      success: true,
      message: "Tournament updated successfully",
    });
}

export const PUT = withApiSecurity(putEditTournamentHandler, {
  rateLimiter: "admin",
  requireAuth: true,
  requireAdmin: true,
  revalidatePaths: ["/tournaments"],
});
