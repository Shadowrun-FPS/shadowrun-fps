/** Admin queue management (`/admin/queues`) — document shape from GET /api/queues + admin fields */
export interface AdminQueueRecord {
  _id: string;
  queueId: string;
  gameType: string;
  teamSize: number;
  /** Optional display tag (low/mid/high or custom); queue name can stand alone. */
  eloTier?: string;
  status: string;
  mapPool?: string[] | null;
  minElo?: number;
  maxElo?: number;
  requiredRoles?: string[];
  /** Resolved labels for `requiredRoles` (GET /api/queues adds this server-side). */
  requiredRoleNames?: string[];
  customQueueChannel?: string;
  customMatchChannel?: string;
  bannedPlayers?: string[];
}

/** Raw map document from GET /api/maps (before `-normal` / `-small` variant ids) */
export interface AdminQueueMapSource {
  _id: string;
  name: string;
  gameMode: string;
  rankedMap: boolean;
  smallOption: boolean;
  src: string;
}

/** Map row + UI variant id (e.g. `...-normal` / `...-small`) for admin map pool picker */
export interface AdminQueueMapVariant {
  _id: string;
  name: string;
  gameMode: string;
  rankedMap: boolean;
  smallOption: boolean;
  src: string;
}

export interface AdminQueuePlayerSearchHit {
  discordId: string;
  discordNickname?: string;
  discordUsername?: string;
}
