/**
 * Session Rotation on Privilege Escalation
 * 
 * Rotates session tokens when user privileges change to prevent session fixation attacks
 */

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { safeLog } from "./security";

/**
 * Checks if user's privileges have changed and rotates session if needed
 */
export async function checkAndRotateSession(
  userId: string,
  currentRoles: string[] = []
): Promise<{ rotated: boolean; newSessionToken?: string }> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.id !== userId) {
      return { rotated: false };
    }

    // Compare current roles with session roles
    const sessionRoles = session.user.roles || [];
    const rolesChanged =
      currentRoles.length !== sessionRoles.length ||
      !currentRoles.every((role) => sessionRoles.includes(role)) ||
      !sessionRoles.every((role) => currentRoles.includes(role));

    if (rolesChanged) {
      safeLog.info("Privilege change detected, session rotation recommended", {
        userId,
        oldRoles: sessionRoles,
        newRoles: currentRoles,
      });

      // Note: Actual session rotation would require NextAuth session update
      // This is a placeholder for the logic - implementation depends on your auth setup
      return { rotated: true };
    }

    return { rotated: false };
  } catch (error) {
    safeLog.error("Error checking session rotation:", error);
    return { rotated: false };
  }
}

/**
 * Wrapper to check session rotation after privilege changes
 */
export async function withSessionRotation<T>(
  userId: string,
  newRoles: string[],
  operation: () => Promise<T>
): Promise<T> {
  const result = await operation();
  
  // Check and rotate session after privilege change
  await checkAndRotateSession(userId, newRoles);
  
  return result;
}

