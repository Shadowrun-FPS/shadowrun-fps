import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { SECURITY_CONFIG } from "@/lib/security-config";
import { canManageTournament } from "@/lib/tournament-permissions";
import { findTeamAcrossCollections } from "@/lib/team-collections";
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity, validateBody } from "@/lib/api-wrapper";
import { revalidatePath } from "next/cache";

async function postUnregisterHandler(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tournamentId = sanitizeString(params.id, 50);
  if (!ObjectId.isValid(tournamentId)) {
    return NextResponse.json(
      { error: "Invalid tournament ID format" },
      { status: 400 }
    );
  }

  const body = await req.json();
  const validation = validateBody(body, {
    teamId: { type: "string", required: true, maxLength: 50 },
  });

  if (!validation.valid) {
    return NextResponse.json(
      { error: validation.errors?.join(", ") || "Invalid input" },
      { status: 400 }
    );
  }

  const validationData = validation.data! as { teamId: string };
  const { teamId } = validationData;
  const sanitizedTeamId = sanitizeString(teamId, 50);

  if (!ObjectId.isValid(sanitizedTeamId)) {
    return NextResponse.json(
      { error: "Invalid team ID format" },
      { status: 400 }
    );
  }

    const { db } = await connectToDatabase();

    // Get the tournament first to check permissions and status
    const tournament = await db.collection("Tournaments").findOne({
      _id: new ObjectId(tournamentId),
    });

    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }

    // Check if tournament is in upcoming status
    if (tournament.status !== "upcoming") {
      return NextResponse.json(
        { error: "Cannot unregister from an active or completed tournament" },
        { status: 400 }
      );
    }

    // Check if user is admin, co-host, or team captain
    const userRoles = session.user.roles || [];
    const isAdmin =
      session?.user?.id === SECURITY_CONFIG.DEVELOPER_ID ||
      (session.user.roles &&
        (session.user.roles.includes("admin") ||
          session.user.roles.includes("moderator")));
    const isTournamentManager = canManageTournament(
      session.user.id,
      userRoles,
      tournament as any
    );

    const isTeamRegistered = tournament.registeredTeams.some(
      (team: any) => team._id.toString() === sanitizedTeamId || team._id === sanitizedTeamId
    );

    if (!isTeamRegistered) {
      return NextResponse.json(
        { error: "Team is not registered in this tournament" },
        { status: 400 }
      );
    }

    if (!isAdmin && !isTournamentManager) {
      const teamResult = await findTeamAcrossCollections(db, sanitizedTeamId);
      if (!teamResult || teamResult.team.captain.discordId !== session.user.id) {
        return NextResponse.json(
          { error: "You must be the team captain, admin, or tournament co-host to unregister" },
          { status: 403 }
        );
      }
    }

    // Check if tournament is seeded (has teams in bracket matches)
    const isSeeded = tournament.brackets?.rounds?.[0]?.matches?.some(
      (match: any) => match.teamA || match.teamB
    );

    const result = await db.collection("Tournaments").updateOne(
      { _id: new ObjectId(tournamentId) },
      {
        $pull: {
          registeredTeams: { _id: sanitizedTeamId } as any,
        },
      }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: "Failed to unregister team" },
        { status: 500 }
      );
    }

    // If tournament was seeded, automatically unseed it since the bracket is now invalid
    if (isSeeded) {
      const emptyRounds = [
        {
          name: "Round 1",
          matches: [],
        },
      ];

      await db.collection("Tournaments").updateOne(
        { _id: new ObjectId(tournamentId) },
        {
          $set: {
            "brackets.rounds": emptyRounds,
            teams: [], // Clear teams array since seeding is removed
            updatedAt: new Date(),
          },
        }
      );
    }

    revalidatePath(`/tournaments/${tournamentId}`);
    revalidatePath("/tournaments");

    return NextResponse.json({
      success: true,
      message: "Team unregistered successfully" + (isSeeded ? ". Tournament seeding has been automatically removed." : ""),
      unseeded: isSeeded,
    });
}

export const POST = withApiSecurity(postUnregisterHandler, {
  rateLimiter: "api",
  requireAuth: true,
  revalidatePaths: ["/tournaments"],
});
