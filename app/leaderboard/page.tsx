import LeaderboardClient from "./leaderboard-client";
import { getLeaderboard } from "@/lib/leaderboard";
import { safeLog } from "@/lib/security";
import type { LeaderboardPayload } from "@/types";

export const revalidate = 60;

async function loadLeaderboard(): Promise<LeaderboardPayload | null> {
  try {
    return await getLeaderboard();
  } catch (error) {
    safeLog.error("Failed to load leaderboard for /leaderboard:", error);
    return null;
  }
}

export default async function LeaderboardPage() {
  const data = await loadLeaderboard();

  return (
    <div className="mx-auto w-full min-w-0 max-w-5xl space-y-4 px-3 pb-10 pt-4 sm:space-y-6 sm:px-6 sm:pt-8 lg:px-8">
      <LeaderboardClient initialData={data} />
    </div>
  );
}
