export interface Queue {
  _id: string;
  queueId: string;
  gameType: string;
  teamSize: number;
  eloTier: "low" | "medium" | "high";
  minElo: number;
  maxElo: number;
  players: Player[];
  status: "open" | "full" | "closed";
  createdAt: string; // ISO date string
  estimatedWaitTime?: number;
}

export interface Player {
  discordId: string;
  discordUsername: string;
  discordNickname: string;
  joinedAt: string; // ISO date string
}
