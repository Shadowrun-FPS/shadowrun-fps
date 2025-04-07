// Create a new file for admin utilities
export const ADMIN_DISCORD_IDS = ["238329746671271936"]; // Your Discord ID

export function isAdmin(userId?: string | null): boolean {
  if (!userId) {
    console.warn("No userId provided for admin check");
    return false;
  }

  // Normalize the ID to ensure consistent comparison
  const normalizedUserId = userId.trim();
  const isAdminUser = ADMIN_DISCORD_IDS.includes(normalizedUserId);

  console.log("Admin check result:", {
    normalizedUserId,
    isAdminUser,
    timestamp: new Date().toISOString(),
  });

  return isAdminUser;
}
