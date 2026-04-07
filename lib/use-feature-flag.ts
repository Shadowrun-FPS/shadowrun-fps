"use client";

import { isFeatureEnabled, type FeatureFlag } from "@/lib/features";

/** Reads `NEXT_PUBLIC_*` feature flags (build-time); no async delay so UI matches on first paint. */
export function useFeatureFlag(feature: string): boolean {
  return isFeatureEnabled(feature as FeatureFlag);
}
