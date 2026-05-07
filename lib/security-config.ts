// Security Configuration - Move all hardcoded IDs to environment variables
export const SECURITY_CONFIG = {
  // Discord User IDs — use NEXT_PUBLIC_* so client components can compare to session.user.id
  // (non-NEXT env vars are undefined in the browser bundle).
  DEVELOPER_ID:
    process.env.NEXT_PUBLIC_DEVELOPER_DISCORD_ID ||
    process.env.DEVELOPER_DISCORD_ID ||
    "DISCORD_ID",

  // Discord Role IDs
  ROLES: {
    ADMIN: process.env.ADMIN_ROLE_ID || "932585751332421642",
    FOUNDER: process.env.FOUNDER_ROLE_ID || "1095126043918082109",
    MODERATOR: process.env.MODERATOR_ROLE_ID || "1042168064805965864",
    GM: process.env.GM_ROLE_ID || "1080979865345458256",
  },

  // Rate Limiting
  RATE_LIMIT: {
    RPM: parseInt(process.env.RATE_LIMIT_RPM || "60"),
    WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000"),
  },

  // CORS Configuration
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS?.split(",") || [
    "http://localhost:3000",
    "https://www.shadowrunfps.com",
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  ],

  // Content Security Policy
  CSP: {
    "default-src": ["'self'"],
    "script-src": [
      "'self'",
      "'unsafe-eval'",
      "'unsafe-inline'",
      "https://va.vercel-scripts.com",
      "https://vercel.live",
    ],
    "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    "font-src": ["'self'", "https://fonts.gstatic.com"],
    "img-src": ["'self'", "data:", "https:", "blob:"],
    "media-src": [
      "'self'",
      "https://www.youtube.com",
      "https://youtube.com",
      "https://www.youtube-nocookie.com",
    ],
    "frame-src": [
      "'self'",
      "https://www.youtube.com",
      "https://youtube.com",
      "https://www.youtube-nocookie.com",
      "https://player.twitch.tv",
      "https://vercel.live",
    ],
    "connect-src": [
      "'self'",
      "https://discord.com",
      "https://api.discord.com",
      "https://playertracker-production.up.railway.app",
      "https://vitals.vercel-insights.com",
      "https://downloads.shadowrunfps.com",
      "wss:",
    ],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
  },
} as const;

// Admin role IDs array for easier checking
export const ADMIN_ROLE_IDS = [
  SECURITY_CONFIG.ROLES.ADMIN,
  SECURITY_CONFIG.ROLES.FOUNDER,
];

// Moderator role IDs array (includes admin roles)
export const MODERATOR_ROLE_IDS = [
  ...ADMIN_ROLE_IDS,
  SECURITY_CONFIG.ROLES.MODERATOR,
  SECURITY_CONFIG.ROLES.GM,
];

// Helper functions
export function isAdmin(userId?: string | null): boolean {
  if (!userId) return false;
  return userId === SECURITY_CONFIG.DEVELOPER_ID;
}

export function isModerator(userId?: string | null): boolean {
  if (!userId) return false;
  return userId === SECURITY_CONFIG.DEVELOPER_ID || isAdmin(userId);
}

export function hasAdminRole(userRoles: string[] = []): boolean {
  return userRoles.some((role) => ADMIN_ROLE_IDS.includes(role));
}

/** Legacy co-developer Discord user id (matches admin / developer gates). */
export const LEGACY_CO_DEVELOPER_DISCORD_ID = "238329746671271936";

export function isDeveloperDiscordUser(userId: string): boolean {
  return (
    userId === SECURITY_CONFIG.DEVELOPER_ID ||
    userId === LEGACY_CO_DEVELOPER_DISCORD_ID
  );
}

/**
 * Home broadcast editor + PUT /api/featured-video: staff roles from env
 * ({@link MODERATOR_ROLE_IDS}), primary/co-developer Discord user ids, or NextAuth isAdmin.
 */
export function canManageFeaturedBroadcast(
  userId: string | undefined,
  discordRoleIds: string[],
  sessionIsAdmin?: boolean,
): boolean {
  if (!userId) return false;
  if (isDeveloperDiscordUser(userId)) return true;
  if (sessionIsAdmin) return true;
  return hasModeratorRole(discordRoleIds);
}

/**
 * Developer / `isAdmin` / **admin & founder** Discord roles only (not moderator/GM).
 * For routes where moderators should pass, use {@link isAuthorizedAdmin} in `lib/admin-auth.ts`.
 */
export function isSessionAdminUser(
  user: { id: string; isAdmin?: boolean; roles?: string[] } | undefined,
  roleIdsForCheck?: string[],
): boolean {
  if (!user?.id) return false;
  if (
    user.id === SECURITY_CONFIG.DEVELOPER_ID ||
    user.id === LEGACY_CO_DEVELOPER_DISCORD_ID
  ) {
    return true;
  }
  if (user.isAdmin) return true;
  const roles =
    roleIdsForCheck && roleIdsForCheck.length > 0
      ? roleIdsForCheck
      : (user.roles ?? []);
  return hasAdminRole(roles);
}

export function hasModeratorRole(userRoles: string[] = []): boolean {
  return userRoles.some((role) => MODERATOR_ROLE_IDS.includes(role));
}

// Generate CSP header string
export function generateCSPHeader(): string {
  return Object.entries(SECURITY_CONFIG.CSP)
    .map(([directive, sources]) => `${directive} ${sources.join(" ")}`)
    .join("; ");
}
