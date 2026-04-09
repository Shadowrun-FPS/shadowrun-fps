import type { Team } from "@/types";
import { getPublicTeamByIdOrTag } from "@/lib/get-public-team";

/**
 * Fetches team data server-side (for RSC). Uses the database directly so production
 * does not depend on HTTP self-fetch (NEXTAUTH_URL, rate limits, or network errors).
 */
export async function getTeamForPage(teamId: string): Promise<Team | null> {
  return getPublicTeamByIdOrTag(teamId);
}
