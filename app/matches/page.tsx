import MatchesClient from "./matches-client";
import { getLeaderboard } from "@/lib/leaderboard";
import { getRankedMatches } from "@/lib/ranked-matches";
import { safeLog } from "@/lib/security";
import type { LeaderboardPayload, RankedMatchesPayload } from "@/types";

export const revalidate = 60;

async function loadMatches(): Promise<RankedMatchesPayload | null> {
  try {
    return await getRankedMatches();
  } catch (error) {
    safeLog.error("Failed to load matches for /matches:", error);
    return null;
  }
}

async function loadLeaderboard(): Promise<LeaderboardPayload | null> {
  try {
    return await getLeaderboard();
  } catch (error) {
    safeLog.error("Failed to load leaderboard for /matches:", error);
    return null;
  }
}

export default async function MatchesPage() {
  // Matches first so the shared ranked snapshot is cached before the slim roster.
  const data = await loadMatches();
  const leaderboard = await loadLeaderboard();

  return (
    <div className="mx-auto w-full min-w-0 max-w-5xl space-y-4 px-3 pb-10 pt-4 sm:space-y-6 sm:px-6 sm:pt-8 lg:px-8">
      <MatchesClient initialData={data} initialLeaderboard={leaderboard} />
    </div>
  );
}
