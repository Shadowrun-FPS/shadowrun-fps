import type { Team } from "@/types";

/**
 * Fetches team data server-side (for RSC). Uses the same API as the client.
 * Call from Server Components only. Requires absolute URL when running on server.
 */
export async function getTeamForPage(teamId: string): Promise<Team | null> {
  const base =
    process.env.NEXTAUTH_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ??
    "http://localhost:3000";
  const url = `${base}/api/teams/${encodeURIComponent(teamId)}`;
  try {
    const res = await fetch(url, {
      next: { revalidate: 60 },
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data as Team;
  } catch {
    return null;
  }
}
