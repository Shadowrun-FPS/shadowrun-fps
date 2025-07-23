// Client-side configuration - NO sensitive Discord IDs exposed here
// This file can be safely included in the client bundle

export const CLIENT_CONFIG = {
  // Role display information (no sensitive IDs)
  ROLE_DISPLAY: {
    admin: { name: "Admin", color: "bg-red-500" },
    founder: { name: "Founder", color: "bg-purple-500" },
    moderator: { name: "Mod", color: "bg-blue-500" },
    gm: { name: "GM", color: "bg-green-500" },
    developer: { name: "Developer", color: "bg-green-600" },
  } as const,

  // Feature flags (these are safe to expose)
  FEATURES: {
    PLAYER_STATS: process.env.NEXT_PUBLIC_FEATURE_PLAYER_STATS === "true",
    MODERATION: process.env.NEXT_PUBLIC_FEATURE_MODERATION === "true",
  },
} as const;

// Client-side utility functions that work with server responses
export interface UserPermissions {
  isAdmin: boolean;
  isModerator: boolean;
  canCreateTournament: boolean;
  isDeveloper: boolean;
  roles?: string[];
}

export interface UserRoleInfo {
  id: string;
  name: string;
  color: string;
}

// Map server role IDs to display information
export function mapRolesToDisplay(roles: string[] = []): UserRoleInfo[] {
  // This will be populated by API responses, not hardcoded IDs
  return [];
}

// Check permissions client-side (based on server response)
export function hasPermission(
  permissions: UserPermissions | null,
  requiredPermission: keyof Pick<
    UserPermissions,
    "isAdmin" | "isModerator" | "canCreateTournament" | "isDeveloper"
  >
): boolean {
  if (!permissions) return false;
  return permissions[requiredPermission] === true;
}

// Safe API endpoints for checking permissions
export const API_ENDPOINTS = {
  USER_PERMISSIONS: "/api/user/permissions",
  USER_ROLES: "/api/discord/user-roles",
} as const;
