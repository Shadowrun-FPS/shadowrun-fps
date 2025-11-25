import { SECURITY_CONFIG, ADMIN_ROLE_IDS, MODERATOR_ROLE_IDS, hasAdminRole } from "@/lib/security-config";

/**
 * Check if a user has permission to manage a tournament
 * @param userId - The user's Discord ID
 * @param userRoles - Array of user's Discord role IDs
 * @param tournament - Tournament object with coHosts and createdBy fields
 * @returns true if user can manage the tournament
 */
export function canManageTournament(
  userId: string,
  userRoles: string[],
  tournament: {
    coHosts?: string[];
    createdBy?: { userId?: string; discordId?: string };
  }
): boolean {
  // Developer always has access
  if (userId === SECURITY_CONFIG.DEVELOPER_ID) {
    return true;
  }

  // Check if user is admin or founder
  if (hasAdminRole(userRoles)) {
    return true;
  }

  // Check if user is the tournament creator
  const createdByUserId = tournament.createdBy?.userId || tournament.createdBy?.discordId;
  if (createdByUserId === userId) {
    return true;
  }

  // Check if user is a co-host
  if (tournament.coHosts && tournament.coHosts.includes(userId)) {
    return true;
  }

  return false;
}

/**
 * Check if a user can register teams for a tournament (admin/co-host only)
 * @param userId - The user's Discord ID
 * @param userRoles - Array of user's Discord role IDs
 * @param tournament - Tournament object with coHosts and createdBy fields
 * @returns true if user can register teams
 */
export function canRegisterTeamsForTournament(
  userId: string,
  userRoles: string[],
  tournament: {
    coHosts?: string[];
    createdBy?: { userId?: string; discordId?: string };
  }
): boolean {
  return canManageTournament(userId, userRoles, tournament);
}

