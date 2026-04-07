export interface PlayerStatEntry {
  lastMatchElo: number;
  teamSize: number;
  elo: number;
  wins: number;
  losses: number;
  lastMatchDate: string;
  globalRank?: number;
}

export interface PlayerRole {
  id: number;
  name: string;
  color: string;
}

export interface PlayerProfile {
  _id: string;
  discordId?: string;
  discordUsername?: string;
  discordNickname?: string;
  discordProfilePicture?: string;
  roles?: PlayerRole[];
  stats: PlayerStatEntry[];
  lastActive?: string;
  banExpiry?: Date | string | null;
}

export interface TeamInfo {
  _id: string;
  name: string;
  tag?: string;
  description?: string;
  teamElo?: number;
  teamSize: number;
  wins: number;
  losses: number;
  tournamentWins: number;
  memberCount: number;
  role: string;
  isCaptain: boolean;
}

export interface LeaderboardPosition {
  position: number | null;
  totalPlayers: number;
  percentile: number | null;
}

export interface MatchTeamPlayer {
  discordId: string;
  discordNickname: string;
  elo: number;
}

export interface MatchHistoryEntry {
  _id: string;
  date: string;
  teamSize: number;
  playerTeam: { players: MatchTeamPlayer[]; score: number };
  opponentTeam: { players: MatchTeamPlayer[]; score: number };
  result: "win" | "loss";
  eloChange: number;
  map: string;
}

export interface EloTrendPoint {
  date: string;
  elo: number;
  eloChange: number;
  result: "win" | "loss";
}

export interface ProfileBundle {
  teams: TeamInfo[];
  leaderboardPositions: Record<string, LeaderboardPosition>;
  matches: MatchHistoryEntry[];
  eloTrends: Record<string, EloTrendPoint[]>;
}
