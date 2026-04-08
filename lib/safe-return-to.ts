/**
 * Validate `returnTo` query for same-origin navigation only (avoid open redirects).
 */
export function parseSafeInternalReturnTo(raw: string | null): string | null {
  if (!raw) return null;
  let decoded: string;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    return null;
  }
  const path = decoded.trim();
  if (!path.startsWith("/") || path.startsWith("//")) return null;
  if (path.includes("://") || path.includes("\\")) return null;
  return path;
}

/** Admin player history URL with optional `returnTo` for smart Back navigation. */
export function playerHistoryHref(
  playerId: string,
  pathname: string,
  searchParams: Pick<URLSearchParams, "toString">,
): string {
  const base = `/admin/players/${encodeURIComponent(playerId)}/history`;
  const current =
    searchParams.toString().length > 0
      ? `${pathname}?${searchParams.toString()}`
      : pathname;
  return `${base}?returnTo=${encodeURIComponent(current)}`;
}

/** For client components without `useSearchParams` (avoids Suspense boundary). */
export function playerHistoryHrefFromBrowserLocation(playerId: string): string {
  if (typeof window === "undefined") {
    return `/admin/players/${encodeURIComponent(playerId)}/history`;
  }
  const params = new URLSearchParams(window.location.search);
  return playerHistoryHref(playerId, window.location.pathname, params);
}
