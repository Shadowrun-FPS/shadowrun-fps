/** Admin moderation panel + `/api/admin/moderation-logs` row shape */
export interface AdminModerationLog {
  _id: string;
  action: string;
  playerId: string;
  playerName: string;
  playerNickname?: string;
  playerProfilePicture?: string | null;
  playerDiscordId?: string;
  moderatorId: string;
  moderatorName: string;
  moderatorNickname?: string;
  moderatorProfilePicture?: string | null;
  moderatorDiscordId?: string;
  reason: string;
  timestamp: string;
  duration?: string;
  expiry?: string;
  hasDispute?: boolean;
  /** Present when `action === "ban"` and server had full ban/unban history */
  banIsActive?: boolean;
}

export interface AdminModerationLogsStats {
  warnings: number;
  activeBans: number;
  totalActions: number;
}

export interface AdminModerationLogsApiResponse {
  logs: AdminModerationLog[];
  activeBans: AdminModerationLog[];
  stats: AdminModerationLogsStats;
  total: number;
  limit: number;
  skip: number;
}
