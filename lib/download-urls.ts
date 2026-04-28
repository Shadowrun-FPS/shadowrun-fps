/** Public CDN / custom domain for launcher artifacts (Cloudflare R2). */
export const DOWNLOADS_ORIGIN = "https://downloads.shadowrunfps.com" as const;

export const PORTABLE_LAUNCHER_ZIP_URL = `${DOWNLOADS_ORIGIN}/Shadowrun%20FPS%20Launcher.zip`;

/**
 * Canonical installer URL for JSON-LD. Bump the version segment when you ship a new stable.
 */
export const LAUNCHER_INSTALLER_SCHEMA_URL = `${DOWNLOADS_ORIGIN}/launcher/Shadowrun%20FPS%20Launcher%20Setup%200.9.107.exe`;
