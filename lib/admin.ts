// Create a new file for admin utilities
export const ADMIN_DISCORD_IDS = ["238329746671271936"]; // Your Discord ID

export function isAdmin(userId?: string | null): boolean {
  // Add more detailed logging
  console.log("Admin check details:", {
    userId,
    adminId: ADMIN_DISCORD_IDS[0],
    exactMatch: userId === ADMIN_DISCORD_IDS[0],
    typeofUserId: typeof userId,
    typeofAdminId: typeof ADMIN_DISCORD_IDS[0],
    sessionPresent: !!userId,
    timestamp: new Date().toISOString(),
  });

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
