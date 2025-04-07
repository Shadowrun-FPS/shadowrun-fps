"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";

/**
 * Component that silently updates player data when session changes
 */
export function PlayerUpdater() {
  const { data: session } = useSession();
  const lastUpdateRef = useRef<string | null>(null);
  const updateTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!session?.user) return;

    // Check if we've already updated this user recently (last 5 minutes)
    const currentTime = Date.now();
    const userId = session.user.id;
    const timeSinceLastUpdate = currentTime - updateTimeRef.current;

    // Only update if this is a different user or it's been more than 5 minutes
    if (lastUpdateRef.current !== userId || timeSinceLastUpdate > 300000) {
      const updatePlayerData = async () => {
        try {
          // Update tracking refs before the API call
          lastUpdateRef.current = userId;
          updateTimeRef.current = currentTime;

          // Use the dedicated API to refresh Discord data
          const response = await fetch("/api/players/refresh-discord-data", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              // Include the nickname fallback hierarchy
              nickname: session.user.nickname || session.user.name,
              // Also update team member info
              updateTeamInfo: true,
            }),
          });

          const data = await response.json();

          if (process.env.NODE_ENV === "development") {
            // Console log removed to reduce noise
          }
        } catch (error) {
          console.error("Error refreshing player data:", error);
        }
      };

      updatePlayerData();
    }
    // Add eslint disable comment to suppress the warning without changing functionality
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]);

  return null; // This component doesn't render anything
}

// Helper function to extract display name from username (often username has underscores while display name has spaces)
function extractDiscordDisplayName(
  username: string | null | undefined
): string | null {
  if (!username) return null;

  // If username contains underscores, try to convert to spaces for display name format
  if (username.includes("_")) {
    const possibleDisplayName = username
      .replace(/_/g, " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
    return possibleDisplayName;
  }

  return username;
}
