export interface Player {
  _id: string;
  discordId?: string;
  discordUsername?: string;
  discordNickname?: string;
  discordProfilePicture?: string;
  isBanned?: boolean;
  banExpiry?: Date | string | null;
  warnings?: Warning[];
  bans?: Ban[];
  teamSizeStats?: Array<{
    teamSize: number;
    elo: number;
    wins: number;
    losses: number;
    lastMatchDate: string;
  }>;
  teamStat?: {
    teamSize: number;
    elo: number;
    wins: number;
    losses: number;
    lastMatchDate: string;
    lastMatchElo?: number;
  };
  stats?: Array<{
    teamSize: number;
    elo: number;
    wins: number;
    losses: number;
    lastMatchDate: string;
    lastMatchElo?: number;
  }>;
  globalRank?: number;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  registeredAt?: Date | string;
  lastActive?: string;
}

export interface Warning {
  _id?: string;
  reason: string;
  ruleId?: string | null;
  moderatorId: string;
  moderatorName: string;
  moderatorNickname?: string;
  timestamp: Date | string;
}

export interface Ban {
  _id?: string;
  reason: string;
  ruleId?: string | null;
  moderatorId: string;
  moderatorName: string;
  moderatorNickname?: string;
  duration?: string;
  expiry?: Date | string | null;
  timestamp: Date | string;
}

export interface Rule {
  _id: string;
  title: string;
  description?: string;
  severity?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface ModerationAction {
  _id: string;
  type: "warning" | "temp_ban" | "perm_ban" | "unban";
  reason: string;
  moderatorId: string;
  moderatorName: string;
  moderatorNickname?: string;
  playerName?: string;
  playerId?: string;
  duration?: string;
  expiry?: Date | string | null;
  timestamp: Date | string;
}

export type ModerationActionType = "warn" | "ban" | "unban";
