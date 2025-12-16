// Security Configuration - Move all hardcoded IDs to environment variables
export const SECURITY_CONFIG = {
  // Discord User IDs
  DEVELOPER_ID: process.env.DEVELOPER_DISCORD_ID || "DISCORD_ID",

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
    "https://shadowrunfps.com",
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
    ],
    "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    "font-src": ["'self'", "https://fonts.gstatic.com"],
    "img-src": ["'self'", "data:", "https:", "blob:"],
    "media-src": ["'self'", "https://www.youtube.com", "https://youtube.com"],
    "frame-src": ["'self'", "https://www.youtube.com", "https://youtube.com"],
    "connect-src": [
      "'self'",
      "https://discord.com",
      "https://api.discord.com",
      "https://playertracker-production.up.railway.app",
      "https://vitals.vercel-insights.com",
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

export function hasModeratorRole(userRoles: string[] = []): boolean {
  return userRoles.some((role) => MODERATOR_ROLE_IDS.includes(role));
}

// Generate CSP header string
export function generateCSPHeader(): string {
  return Object.entries(SECURITY_CONFIG.CSP)
    .map(([directive, sources]) => `${directive} ${sources.join(" ")}`)
    .join("; ");
}
