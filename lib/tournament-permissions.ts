import { SECURITY_CONFIG, ADMIN_ROLE_IDS, MODERATOR_ROLE_IDS, hasAdminRole } from "@/lib/security-config";

/**
 * Check if a user has permission to manage a tournament
 * @param userId - The user's Discord ID
 * @param userRoles - Array of user's Discord role IDs
 * @param tournament - Tournament object with coHosts and createdBy fields
 * @returns true if user can manage the tournament
 */
/** Co-host entries can be plain Discord ID strings or enriched profile objects. */
type CoHostEntry = string | { discordId: string };

function extractCoHostId(entry: CoHostEntry): string {
  return typeof entry === "string" ? entry : entry.discordId;
}

export function canManageTournament(
  userId: string,
  userRoles: string[],
  tournament: {
    coHosts?: CoHostEntry[];
    createdBy?: { userId?: string; discordId?: string };
  }
): boolean {
  if (userId === SECURITY_CONFIG.DEVELOPER_ID) {
    return true;
  }

  if (hasAdminRole(userRoles)) {
    return true;
  }

  const createdByUserId = tournament.createdBy?.userId || tournament.createdBy?.discordId;
  if (createdByUserId === userId) {
    return true;
  }

  if (tournament.coHosts?.some((c) => extractCoHostId(c) === userId)) {
    return true;
  }

  return false;
}

/**
 * Check if a user can register teams for a tournament (admin/co-host only)
 */
export function canRegisterTeamsForTournament(
  userId: string,
  userRoles: string[],
  tournament: {
    coHosts?: CoHostEntry[];
    createdBy?: { userId?: string; discordId?: string };
  }
): boolean {
  return canManageTournament(userId, userRoles, tournament);
}

