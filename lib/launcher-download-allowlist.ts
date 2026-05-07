/**
 * Basenames allowed for GET /api/launcher/download?file=
 * Prevents presigned-URL generation for arbitrary R2 keys under launcher/.
 *
 * Portable `Shadowrun FPS Launcher.exe` lives at bucket root — link via PORTABLE_LAUNCHER_URL in
 * lib/download-urls.ts, not this route (object keys here are always launcher/<basename>).
 *
 * Extend with env LAUNCHER_DOWNLOAD_FILENAMES (comma-separated basenames).
 */

const DEFAULT_ALLOWED_EXACT = ["Shadowrun FPS Launcher.zip"] as const;

/** Matches installer builds shipped under launcher/ (version segment bumps over time). */
const SETUP_EXE_PATTERN =
  /^Shadowrun FPS Launcher Setup \d+\.\d+\.\d+\.exe$/i;

function normalizeBasename(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

function envExtraNames(): string[] {
  const raw = process.env.LAUNCHER_DOWNLOAD_FILENAMES;
  if (!raw?.trim()) return [];
  return raw
    .split(",")
    .map((s) => normalizeBasename(s))
    .filter(Boolean);
}

/**
 * Returns true if basename may be requested for presigned launcher downloads.
 * Traversal sequences must already be rejected by the caller.
 */
export function isLauncherDownloadFilenameAllowed(filename: string): boolean {
  if (!filename || typeof filename !== "string") return false;
  if (filename.length > 240) return false;

  const normalized = normalizeBasename(filename);
  if (
    normalized.includes("..") ||
    normalized.includes("/") ||
    normalized.includes("\\")
  ) {
    return false;
  }

  if (SETUP_EXE_PATTERN.test(normalized)) {
    return true;
  }

  const lower = normalized.toLowerCase();
  const exactSet = new Set<string>(
    [...DEFAULT_ALLOWED_EXACT, ...envExtraNames()].map((n) =>
      n.toLowerCase()
    )
  );

  return exactSet.has(lower);
}
