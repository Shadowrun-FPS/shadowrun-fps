/** Public CDN / custom domain for launcher artifacts (Cloudflare R2). */
export const DOWNLOADS_ORIGIN = "https://downloads.shadowrunfps.com" as const;

export const PORTABLE_LAUNCHER_ZIP_URL = `${DOWNLOADS_ORIGIN}/Shadowrun%20FPS%20Launcher.exe`;

/** Windows — paste into File Explorer address bar to open `main.log` for launcher support. */
export const LAUNCHER_MAIN_LOG_PATH =
  "%APPDATA%\\Shadowrun FPS Launcher\\logs\\main.log" as const;

/**
 * Canonical installer URL for JSON-LD. Bump the version segment when you ship a new stable.
 */
export const LAUNCHER_INSTALLER_SCHEMA_URL = `${DOWNLOADS_ORIGIN}/launcher/Shadowrun%20FPS%20Launcher%20Setup%200.9.112.exe`;
