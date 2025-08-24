import { SECURITY_CONFIG } from "@/lib/security-config";

// Create a new file for admin utilities
export const ADMIN_DISCORD_IDS = [SECURITY_CONFIG.DEVELOPER_ID];

export function isAdmin(userId?: string | null): boolean {
  if (!userId) {
    return false;
  }

  // Normalize the ID to ensure consistent comparison
  const normalizedUserId = userId.trim();
  const isAdminUser = ADMIN_DISCORD_IDS.includes(normalizedUserId);

  return isAdminUser;
}
