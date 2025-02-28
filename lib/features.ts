type FeatureFlag =
  | "queues"
  | "tournaments"
  | "rankings"
  | "teams"
  | "scrimmage";

const FEATURE_FLAGS: Record<FeatureFlag, boolean> = {
  queues: process.env.NEXT_PUBLIC_FEATURE_QUEUES === "true",
  tournaments: process.env.NEXT_PUBLIC_FEATURE_TOURNAMENTS === "true",
  rankings: process.env.NEXT_PUBLIC_FEATURE_RANKINGS === "true",
  teams: process.env.NEXT_PUBLIC_FEATURE_TEAMS === "true",
  scrimmage: process.env.NEXT_PUBLIC_FEATURE_SCRIMMAGE === "true",
};

export function isFeatureEnabled(feature: FeatureFlag): boolean {
  return FEATURE_FLAGS[feature] ?? false;
}
