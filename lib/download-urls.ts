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

export const GAME_VERSION = "1.5" as const;
export const LAUNCHER_VERSION = "1.0" as const;

/** Current launcher setup. One file; the installer handles game download, updates, and repair. */
export const LAUNCHER_SETUP_URL =
  "https://download.shadowrunfps.com/Shadowrun-Launcher-Setup.exe" as const;

/** Canonical installer URL for JSON-LD. */
export const LAUNCHER_INSTALLER_SCHEMA_URL = LAUNCHER_SETUP_URL;
