// Helper function to check admin authorization
// This can be used across all admin API routes
import { Session } from "next-auth";
import { SECURITY_CONFIG, hasAdminRole, hasModeratorRole } from "./security-config";

const DEVELOPER_DISCORD_ID = "238329746671271936";

export function isAuthorizedAdmin(session: Session | null): boolean {
  if (!session?.user) {
    return false;
  }

  const isDeveloper = 
    session.user.id === SECURITY_CONFIG.DEVELOPER_ID || 
    session.user.id === DEVELOPER_DISCORD_ID;
  
  const userRoles = session.user.roles || [];
  const userHasAdminRole = hasAdminRole(userRoles);
  const userHasModeratorRole = hasModeratorRole(userRoles);
  const isAdminUser = session.user.isAdmin;

  return isDeveloper || isAdminUser || userHasAdminRole || userHasModeratorRole;
}

