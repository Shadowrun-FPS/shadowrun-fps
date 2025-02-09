"use client";

import { useState, useEffect } from "react";

type FeatureFlags = {
  leaderboard: boolean;
  matches: boolean;
  stats: boolean;
};

const getFeatureFlag = (flagName: keyof FeatureFlags): boolean => {
  return (
    process.env[`NEXT_PUBLIC_FEATURE_FLAGS_${flagName.toUpperCase()}`] ===
    "true"
  );
};

export function useFeatureFlag(
  flagName: keyof FeatureFlags,
  defaultValue: boolean = false
) {
  const [isEnabled, setIsEnabled] = useState(defaultValue);

  useEffect(() => {
    // Here you can implement your feature flag logic
    // For example, fetching from an API or local storage
    const checkFeatureFlag = async () => {
      try {
        const flag = getFeatureFlag(flagName);
        setIsEnabled(flag);
      } catch (error) {
        console.error(`Error checking feature flag ${flagName}:`, error);
        setIsEnabled(defaultValue);
      }
    };

    checkFeatureFlag();
  }, [flagName, defaultValue]);

  return isEnabled;
}
