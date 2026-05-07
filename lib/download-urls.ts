/** Public CDN / custom domain for launcher artifacts (Cloudflare R2). */
export const DOWNLOADS_ORIGIN = "https://downloads.shadowrunfps.com" as const;

/**
 * Optional CDN/browser cache-bust for the root portable object (e.g. `0.9.113`).
 * Set `NEXT_PUBLIC_PORTABLE_LAUNCHER_CACHE_BUST` in Vercel when you publish a new portable build
 * if clients still see an old file at the same URL.
 */
const portableLauncherCacheBust =
  process.env.NEXT_PUBLIC_PORTABLE_LAUNCHER_CACHE_BUST?.trim() ?? "";

/**
 * Portable launcher — object at bucket root (`Shadowrun FPS Launcher.exe`), not under `launcher/`.
 * Same resource as https://downloads.shadowrunfps.com/Shadowrun%20FPS%20Launcher.exe (optional `?v=` from env).
 */
export const PORTABLE_LAUNCHER_URL =
  portableLauncherCacheBust.length > 0
    ? `${DOWNLOADS_ORIGIN}/Shadowrun%20FPS%20Launcher.exe?v=${encodeURIComponent(portableLauncherCacheBust)}`
    : `${DOWNLOADS_ORIGIN}/Shadowrun%20FPS%20Launcher.exe`;

/** Windows — paste into File Explorer address bar to open `main.log` for launcher support. */
export const LAUNCHER_MAIN_LOG_PATH =
  "%APPDATA%\\Shadowrun FPS Launcher\\logs\\main.log" as const;

/**
 * Canonical installer URL for JSON-LD. Bump the version segment when you ship a new stable.
 */
export const LAUNCHER_INSTALLER_SCHEMA_URL = `${DOWNLOADS_ORIGIN}/launcher/Shadowrun%20FPS%20Launcher%20Setup%200.9.112.exe`;
