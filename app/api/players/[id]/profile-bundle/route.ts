import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getAllTeamCollectionNames } from "@/lib/team-collections";
import { secureLogger } from "@/lib/secure-logger";
import { isFeatureEnabled } from "@/lib/features";
import type { Db } from "mongodb";
import type {
  ProfileBundle,
  TeamInfo,
  LeaderboardPosition,
  MatchHistoryEntry,
  EloTrendPoint,
} from "@/types/player";

export const dynamic = "force-dynamic";

async function fetchTeams(db: Db, playerId: string): Promise<TeamInfo[]> {
  if (!isFeatureEnabled("teams")) return [];

  const allCollections = getAllTeamCollectionNames();
  const allTeams: Record<string, unknown>[] = [];

  for (const collectionName of allCollections) {
    const teams = await db
      .collection(collectionName)
      .find({ "members.discordId": playerId })
      .toArray();
    allTeams.push(...(teams as Record<string, unknown>[]));
  }

  const teamsWithRole: TeamInfo[] = allTeams.map((team) => {
    const members = (team.members as { discordId: string; role?: string }[]) ?? [];
    const captain = team.captain as { discordId?: string } | undefined;
    const member = members.find((m) => m.discordId === playerId);
    const isCaptain = captain?.discordId === playerId;

    return {
      _id: String(team._id),
      name: String(team.name ?? ""),
      tag: team.tag ? String(team.tag) : undefined,
      description: team.description ? String(team.description) : undefined,
      teamElo: typeof team.teamElo === "number" ? team.teamElo : undefined,
      wins: Number(team.wins ?? 0),
      losses: Number(team.losses ?? 0),
      tournamentWins: Number(team.tournamentWins ?? 0),
      memberCount: members.length,
      teamSize: Number(team.teamSize ?? 4),
      role: isCaptain ? "captain" : (member?.role ?? "member"),
      isCaptain,
    };
  });

  teamsWithRole.sort((a, b) => {
    if (a.teamSize === 4 && b.teamSize !== 4) return -1;
    if (b.teamSize === 4 && a.teamSize !== 4) return 1;
    return a.teamSize - b.teamSize;
  });

  return teamsWithRole;
}

async function fetchLeaderboardPosition(
  db: Db,
  playerElo: number,
  teamSize: number
): Promise<LeaderboardPosition> {
  const [playersAbove, totalPlayers] = await Promise.all([
    db
      .collection("Players")
      .countDocuments({ stats: { $elemMatch: { teamSize, elo: { $gt: playerElo } } } }),
    db.collection("Players").countDocuments({ "stats.teamSize": teamSize }),
  ]);

  const position = playersAbove + 1;
  const percentile =
    totalPlayers > 0
      ? Math.round(((totalPlayers - position + 1) / totalPlayers) * 100)
      : null;

  return { position, totalPlayers, percentile };
}

async function fetchMatches(db: Db, playerId: string): Promise<MatchHistoryEntry[]> {
  const matches = await db
    .collection("Matches")
    .find({
      $or: [
        { "teamA.players.discordId": playerId },
        { "teamB.players.discordId": playerId },
        { "team1.players.discordId": playerId },
        { "team2.players.discordId": playerId },
        { "teams.teamA": playerId },
        { "teams.teamB": playerId },
      ],
      status: { $in: ["completed", "confirmed"] },
    })
    .sort({ completedAt: -1, createdAt: -1 })
    .limit(20)
    .toArray();

  return matches
    .map((match) => {
      const m = match as Record<string, unknown>;
      let playerTeam = "";
      let opponentTeam = "";
      let playerTeamPlayers: Record<string, unknown>[] = [];
      let opponentTeamPlayers: Record<string, unknown>[] = [];
      let playerScore = 0;
      let opponentScore = 0;
      let playerWon = false;

      const teamA = m.teamA as { players?: Record<string, unknown>[] } | undefined;
      const teamB = m.teamB as { players?: Record<string, unknown>[] } | undefined;
      const team1 = m.team1 as { players?: Record<string, unknown>[] } | undefined;
      const team2 = m.team2 as { players?: Record<string, unknown>[] } | undefined;
      const teams = m.teams as { teamA?: string[]; teamB?: string[] } | undefined;
      const scores = m.scores as Record<string, number> | undefined;

      if (teamA?.players || teamB?.players) {
        const inTeamA = teamA?.players?.some((p) => p.discordId === playerId);
        playerTeam = inTeamA ? "teamA" : "teamB";
        opponentTeam = inTeamA ? "teamB" : "teamA";
        playerTeamPlayers = (inTeamA ? teamA?.players : teamB?.players) ?? [];
        opponentTeamPlayers = (inTeamA ? teamB?.players : teamA?.players) ?? [];
        playerScore = scores?.[playerTeam] ?? 0;
        opponentScore = scores?.[opponentTeam] ?? 0;
        playerWon = m.winner === playerTeam;
      } else if (team1?.players || team2?.players) {
        const inTeam1 = team1?.players?.some((p) => p.discordId === playerId);
        playerTeam = inTeam1 ? "team1" : "team2";
        opponentTeam = inTeam1 ? "team2" : "team1";
        playerTeamPlayers = (inTeam1 ? team1?.players : team2?.players) ?? [];
        opponentTeamPlayers = (inTeam1 ? team2?.players : team1?.players) ?? [];
        playerScore = scores?.[playerTeam] ?? 0;
        opponentScore = scores?.[opponentTeam] ?? 0;
        playerWon =
          m.winner === playerTeam || m.winner === (inTeam1 ? 1 : 2);
      } else if (teams?.teamA || teams?.teamB) {
        const inTeamA = teams?.teamA?.includes(playerId);
        playerTeam = inTeamA ? "teamA" : "teamB";
        opponentTeam = inTeamA ? "teamB" : "teamA";
        playerScore = scores?.[playerTeam] ?? 0;
        opponentScore = scores?.[opponentTeam] ?? 0;
        playerWon = m.winner === playerTeam;
        const rawIds = (inTeamA ? teams?.teamA : teams?.teamB) ?? [];
        playerTeamPlayers = rawIds.map((id) => ({ discordId: id }));
        const oppIds = (inTeamA ? teams?.teamB : teams?.teamA) ?? [];
        opponentTeamPlayers = oppIds.map((id) => ({ discordId: id }));
      } else {
        return null;
      }

      const eloChanges = m.eloChanges as Record<string, number> | undefined;

      return {
        _id: String(m._id),
        date: String(m.completedAt ?? m.createdAt ?? m.playedAt ?? ""),
        teamSize: Number(m.teamSize ?? 4),
        playerTeam: {
          players: playerTeamPlayers.map((p) => ({
            discordId: String(p.discordId ?? p),
            discordNickname: String(
              p.discordNickname ?? p.discordUsername ?? "Unknown"
            ),
            elo: Number(p.elo ?? 0),
          })),
          score: playerScore,
        },
        opponentTeam: {
          players: opponentTeamPlayers.map((p) => ({
            discordId: String(p.discordId ?? p),
            discordNickname: String(
              p.discordNickname ?? p.discordUsername ?? "Unknown"
            ),
            elo: Number(p.elo ?? 0),
          })),
          score: opponentScore,
        },
        result: (playerWon ? "win" : "loss") as "win" | "loss",
        eloChange: eloChanges?.[playerId] ?? 0,
        map: String(
          m.map ??
            (Array.isArray(m.maps) ? m.maps[0] : undefined) ??
            "Unknown"
        ),
      } satisfies MatchHistoryEntry;
    })
    .filter((m): m is MatchHistoryEntry => m !== null);
}

async function fetchTrends(
  db: Db,
  playerId: string,
  teamSize: number
): Promise<EloTrendPoint[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);

  const matches = await db
    .collection("Matches")
    .find({
      $and: [
        {
          $or: [
            { "teamA.players.discordId": playerId },
            { "teamB.players.discordId": playerId },
            { "team1.players.discordId": playerId },
            { "team2.players.discordId": playerId },
            { "teams.teamA": playerId },
            { "teams.teamB": playerId },
          ],
        },
        {
          $or: [
            { completedAt: { $gte: startDate } },
            { createdAt: { $gte: startDate } },
            { playedAt: { $gte: startDate } },
          ],
        },
      ],
      status: { $in: ["completed", "confirmed"] },
      teamSize,
    })
    .sort({ completedAt: 1, createdAt: 1, playedAt: 1 })
    .toArray();

  return matches
    .map((match) => {
      const m = match as Record<string, unknown>;
      let playerTeam = "";
      let playerElo = 0;

      const teamA = m.teamA as { players?: Record<string, unknown>[] } | undefined;
      const teamB = m.teamB as { players?: Record<string, unknown>[] } | undefined;
      const team1 = m.team1 as { players?: Record<string, unknown>[] } | undefined;
      const team2 = m.team2 as { players?: Record<string, unknown>[] } | undefined;

      if (teamA?.players || teamB?.players) {
        const inTeamA = teamA?.players?.some((p) => p.discordId === playerId);
        playerTeam = inTeamA ? "teamA" : "teamB";
        const teamPlayers = (inTeamA ? teamA?.players : teamB?.players) ?? [];
        playerElo =
          Number(
            teamPlayers.find((p) => p.discordId === playerId)?.elo
          ) || 0;
      } else if (team1?.players || team2?.players) {
        const inTeam1 = team1?.players?.some((p) => p.discordId === playerId);
        playerTeam = inTeam1 ? "team1" : "team2";
        const teamPlayers = (inTeam1 ? team1?.players : team2?.players) ?? [];
        playerElo =
          Number(
            teamPlayers.find((p) => p.discordId === playerId)?.elo
          ) || 0;
      } else {
        return null;
      }

      const eloChanges = m.eloChanges as Record<string, number> | undefined;
      const eloChange = eloChanges?.[playerId] ?? 0;
      const playerWon =
        m.winner === playerTeam ||
        m.winner === (playerTeam === "team1" ? 1 : 2);

      return {
        date: String(m.completedAt ?? m.createdAt ?? m.playedAt ?? ""),
        elo: playerElo - eloChange,
        eloChange,
        result: (playerWon ? "win" : "loss") as "win" | "loss",
      } satisfies EloTrendPoint;
    })
    .filter((t): t is EloTrendPoint => t !== null);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { db } = await connectToDatabase();

    const teamSizesParam = request.nextUrl.searchParams.get("teamSizes") ?? "";
    const teamSizes = teamSizesParam
      ? teamSizesParam
          .split(",")
          .map(Number)
          .filter((n) => !isNaN(n) && n > 0)
      : [];

    // Fetch the player's stats once to avoid re-querying per team size
    const playerDoc = await db
      .collection("Players")
      .findOne({ discordId: id }, { projection: { stats: 1 } });

    const playerStatsBySize: Record<number, number> = {};
    if (playerDoc && Array.isArray(playerDoc.stats)) {
      for (const s of playerDoc.stats as { teamSize: number; elo: number }[]) {
        if (s.teamSize && s.elo !== undefined) {
          playerStatsBySize[s.teamSize] = s.elo;
        }
      }
    }

    // Run teams, matches, leaderboard positions, and trends all in parallel
    const [teamsResult, matchesResult, ...dynamicResults] =
      await Promise.allSettled([
        fetchTeams(db, id),
        fetchMatches(db, id),
        ...teamSizes.map((size) => {
          const elo = playerStatsBySize[size];
          if (elo === undefined)
            return Promise.resolve<LeaderboardPosition>({
              position: null,
              totalPlayers: 0,
              percentile: null,
            });
          return fetchLeaderboardPosition(db, elo, size);
        }),
        ...teamSizes.map((size) => fetchTrends(db, id, size)),
      ]);

    const teams =
      teamsResult.status === "fulfilled" ? teamsResult.value : [];
    const matches =
      matchesResult.status === "fulfilled" ? matchesResult.value : [];

    const leaderboardPositions: Record<string, LeaderboardPosition> = {};
    const eloTrends: Record<string, EloTrendPoint[]> = {};

    teamSizes.forEach((size, i) => {
      const key = `${size}v${size}`;
      const lbResult = dynamicResults[i];
      const trendResult = dynamicResults[teamSizes.length + i];

      leaderboardPositions[key] =
        lbResult?.status === "fulfilled"
          ? (lbResult.value as LeaderboardPosition)
          : { position: null, totalPlayers: 0, percentile: null };

      eloTrends[key] =
        trendResult?.status === "fulfilled"
          ? (trendResult.value as EloTrendPoint[])
          : [];
    });

    return NextResponse.json(
      { teams, leaderboardPositions, matches, eloTrends } satisfies ProfileBundle,
      { headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600" } }
    );
  } catch (error) {
    secureLogger.error("Failed to fetch profile bundle", error);
    return NextResponse.json(
      { error: "Failed to fetch profile bundle" },
      { status: 500 }
    );
  }
}
