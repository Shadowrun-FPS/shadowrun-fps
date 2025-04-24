export type FeatureFlag =
  | "queues"
  | "matches"
  | "tournaments"
  | "rankings"
  | "teams"
  | "scrimmage"
  | "leaderboard"
  | "playerStats";

const FEATURE_FLAGS: Record<FeatureFlag, boolean> = {
  queues: process.env.NEXT_PUBLIC_FEATURE_QUEUES === "true",
  matches: process.env.NEXT_PUBLIC_FEATURE_MATCHES === "true",
  tournaments: process.env.NEXT_PUBLIC_FEATURE_TOURNAMENTS === "true",
  rankings: process.env.NEXT_PUBLIC_FEATURE_RANKINGS === "true",
  teams: process.env.NEXT_PUBLIC_FEATURE_TEAMS === "true",
  scrimmage: process.env.NEXT_PUBLIC_FEATURE_SCRIMMAGE === "true",
  leaderboard: process.env.NEXT_PUBLIC_FEATURE_LEADERBOARD === "true",
  playerStats: process.env.NEXT_PUBLIC_FEATURE_PLAYER_STATS === "true",
};

export function isFeatureEnabled(feature: FeatureFlag): boolean {
  return FEATURE_FLAGS[feature] ?? false;
}

import { useState, useEffect } from "react";

export function useFeatureFlag(feature: string): boolean {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setEnabled(isFeatureEnabled(feature as FeatureFlag));
  }, [feature]);

  return enabled;
}
