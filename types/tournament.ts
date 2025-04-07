// Create a new file for shared types
export interface TournamentMatch {
  tournamentMatchId: string;
  tournamentId: string;
  roundIndex: number;
  matchIndex: number;
  teamA: Team | null;
  teamB: Team | null;
  mapScores?: MapScore[];
  status: "upcoming" | "live" | "completed";
  createdAt: string;
  maps?: Map[];
}

export interface Team {
  _id: string;
  name: string;
  tag: string;
  teamElo?: number;
  members?: TeamMember[];
  captain?: TeamMember;
}

export interface TeamMember {
  discordId: string;
  discordUsername: string;
  discordNickname?: string | null;
  discordProfilePicture?: string | null;
  elo?: number;
  role?: string;
}

export interface Map {
  mapName: string;
  gameMode: string;
  smallOption?: boolean;
}

export interface MapScore {
  team1Score: number;
  team2Score: number;
  winner?: 1 | 2 | null;
  submittedByTeam1?: boolean;
  submittedByTeam2?: boolean;
  [key: string]: any; // Allow dynamic properties like submittedByTeam${number}
}
