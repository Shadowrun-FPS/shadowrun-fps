/**
 * Staff authorization for CMS-style routes (FAQs import, etc.).
 *
 * **Use `isAuthorizedAdmin`** when moderators/GMs should act (matches POST /api/faqs/import).
 *
 * **Use `isSessionAdminUser` from `@/lib/security-config`** for destructive or
 * highly sensitive actions (e.g. some routes use admin/founder-only checks via `withApiSecurity` `requireAdmin`).
 */
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

