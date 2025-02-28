import type { MongoTeam, Player } from "@/types/mongodb";

export function getPlayerDisplayName(player: Partial<Player>): string {
  return player.discordNickname || player.discordUsername || "Unknown Player";
}

export function getTeamDisplayName(team: Partial<MongoTeam>): string {
  return team.name || "Unknown Team";
}

export function getPlayerUsername(player: Partial<Player>): string {
  return player.discordUsername || "Unknown Username";
}

export function validateTeamData(team: Partial<MongoTeam>): MongoTeam {
  if (!team) throw new Error("Team data is missing");
  if (!team.captain) throw new Error("Team captain is missing");
  if (!team.members) throw new Error("Team members are missing");

  return {
    ...team,
    teamElo: team.teamElo || "1500",
    wins: team.wins || 0,
    losses: team.losses || 0,
    members: team.members.map((member) => ({
      ...member,
      role: member.role || "member",
      joinedAt: member.joinedAt || new Date(),
    })),
  } as MongoTeam;
}
