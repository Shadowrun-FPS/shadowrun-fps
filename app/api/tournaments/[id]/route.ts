import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity } from "@/lib/api-wrapper";

// Helper function to recalculate team ELO for a specific tournament team size
async function recalculateTeamEloForTournament(
  teamId: string,
  tournamentTeamSize: number,
  db: any,
  db2: any
): Promise<number> {
  const DEFAULT_INDIVIDUAL_ELO = 800;

  // Get the team document - search across all collections
  const { findTeamAcrossCollections } = await import("@/lib/team-collections");
  const teamResult = await findTeamAcrossCollections(db, teamId);
  if (!teamResult) {
    return DEFAULT_INDIVIDUAL_ELO * tournamentTeamSize;
  }
  const team = teamResult.team;

  if (!team || !team.members || team.members.length === 0) {
    return DEFAULT_INDIVIDUAL_ELO * tournamentTeamSize;
  }

  // Get all member IDs including captain
  const memberIds = team.members.map((member: any) => member.discordId);
  if (team.captain && team.captain.discordId) {
    if (!memberIds.includes(team.captain.discordId)) {
      memberIds.push(team.captain.discordId);
    }
  }

  // Get players data from ShadowrunWeb
  const webPlayers = await db
    .collection("Players")
    .find({ discordId: { $in: memberIds } })
    .toArray();

  // If team size is 4, also get players from ShadowrunDB2
  let db2Players: any[] = [];
  if (tournamentTeamSize === 4) {
    db2Players = await db2
      .collection("players")
      .find({ discordId: { $in: memberIds } })
      .toArray();
  }

  // Calculate ELO for each member
  const memberElos: number[] = [];
  for (const playerId of memberIds) {
    let playerElo = DEFAULT_INDIVIDUAL_ELO;

    // First check ShadowrunWeb for player stats
    const webPlayer = webPlayers.find((p: any) => p.discordId === playerId);
    if (webPlayer && webPlayer.stats && Array.isArray(webPlayer.stats)) {
      const statForSize = webPlayer.stats.find(
        (s: any) => s.teamSize === tournamentTeamSize
      );
      if (statForSize && typeof statForSize.elo === "number") {
        playerElo = statForSize.elo;
      }
    }

    // For teamSize 4, prioritize DB2 data if available
    if (tournamentTeamSize === 4) {
      const db2Player = db2Players.find((p: any) => p.discordId === playerId);
      if (db2Player && db2Player.rating !== undefined) {
        playerElo = db2Player.rating;
      }
    }

    memberElos.push(playerElo);
  }

  // Take top players based on tournament team size
  const sortedElos = [...memberElos].sort((a, b) => b - a);
  const topElos = sortedElos.slice(0, tournamentTeamSize);
  const totalElo = topElos.reduce((sum, elo) => sum + elo, 0);

  return totalElo || DEFAULT_INDIVIDUAL_ELO * tournamentTeamSize;
}

interface Team {
  _id: string | ObjectId;
  name: string;
  tag: string;
  captain?: {
    discordId: string;
    discordUsername?: string;
    discordNickname?: string;
    discordProfilePicture?: string;
  };
  members?: Array<{
    discordId: string;
    discordUsername?: string;
    discordNickname?: string;
    discordProfilePicture?: string;
    role?: string;
  }>;
  teamElo?: number;
}

interface TeamMember {
  discordId?: string;
  discordUsername?: string;
  discordNickname?: string | null;
  discordProfilePicture?: string | null;
  role?: string;
  elo?: number;
}

async function getTournamentHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idParam } = await params;
  const id = sanitizeString(idParam, 50);

  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

    const client = await clientPromise;
    const db = client.db("ShadowrunWeb");
    const db2 = client.db("ShadowrunDB2");

    const tournament = await db.collection("Tournaments").findOne({
      _id: new ObjectId(id),
    });

    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }

    const tournamentTeamSize = tournament.teamSize || 4;

    // Important: Fix the registeredTeams structure and recalculate ELO
    if (
      tournament.registeredTeams &&
      Array.isArray(tournament.registeredTeams)
    ) {
      // Enhance each team with proper structure and fresh ELO
      const enhancedTeams = await Promise.all(
        tournament.registeredTeams.map(async (team) => {
          // Recalculate team ELO based on current player ELOs and tournament team size
          let freshTeamElo = 0;
          if (team._id) {
            try {
              freshTeamElo = await recalculateTeamEloForTournament(
                team._id.toString(),
                tournamentTeamSize,
                db,
                db2
              );
            } catch (error) {
              safeLog.error(
                `Error recalculating ELO for team ${team._id}:`,
                error
              );
              freshTeamElo =
                typeof team.teamElo === "number" ? team.teamElo : 0;
            }
          }

          // Ensure we have an object with proper structure
          return {
            _id: team._id ? team._id.toString() : "",
            name: team.name || "Unknown Team",
            tag: team.tag || "",
            description: team.description || "",
            teamElo: freshTeamElo,

            // Ensure members is always an array
            members: Array.isArray(team.members)
              ? team.members.map((member: TeamMember) => ({
                  discordId: member.discordId || "",
                  discordUsername: member.discordUsername || "Unknown",
                  discordNickname: member.discordNickname || null,
                  discordProfilePicture: member.discordProfilePicture || null,
                  role: member.role || "member",
                  elo: typeof member.elo === "number" ? member.elo : 0,
                }))
              : [],

            // Ensure captain is a valid object
            captain: team.captain
              ? {
                  discordId: team.captain.discordId || "",
                  discordUsername: team.captain.discordUsername || "Unknown",
                  discordNickname: team.captain.discordNickname || null,
                  discordProfilePicture:
                    team.captain.discordProfilePicture || null,
                  elo:
                    typeof team.captain.elo === "number" ? team.captain.elo : 0,
                }
              : {
                  discordId: "",
                  discordUsername: "Unknown",
                  discordNickname: null,
                  discordProfilePicture: null,
                  elo: 0,
                },
          };
        })
      );

      tournament.registeredTeams = enhancedTeams;
    } else {
      tournament.registeredTeams = [];
    }

    // Convert ObjectId to string for the entire object
    const formattedTournament = {
      ...tournament,
      _id: tournament._id.toString(),
      // For "teams" array (references to team IDs)
      teams: tournament.teams
        ? tournament.teams.map((teamId: string | ObjectId) =>
            typeof teamId === "object" ? teamId.toString() : teamId
          )
        : [],
      // Use the fixed registeredTeams we created above
      registeredTeams: tournament.registeredTeams,
    };

    const response = NextResponse.json(formattedTournament);
    response.headers.set(
      "Cache-Control",
      "public, s-maxage=300, stale-while-revalidate=1800"
    );
    return response;
}

export const GET = withApiSecurity(getTournamentHandler, {
  rateLimiter: "api",
  cacheable: true,
  cacheMaxAge: 300,
});
