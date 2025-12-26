"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";

/**
 * Component that updates player data periodically, not just on login
 */
export function PlayerUpdater() {
  const { data: session } = useSession();
  const lastUpdateRef = useRef<string | null>(null);
  const updateTimeRef = useRef<number>(0);
  const [guildNickname, setGuildNickname] = useState<string | null>(null);
  const pathname = usePathname();

  // Fetch guild nickname if available (only once per session)
  useEffect(() => {
    if (!session?.user?.id) return;
    // Only fetch if page is visible
    if (document.hidden) return;

    const fetchGuildNickname = async () => {
      try {
        // Try to get the guild-specific nickname if available
        const response = await fetch(
          `/api/discord/guild-nickname?userId=${session.user.id}`
        );
        if (response.ok) {
          const data = await response.json();
          setGuildNickname(data.guildNickname || null);
        } else if (response.status === 429) {
          // Rate limited, skip this fetch
          return;
        }
      } catch (error) {
        // Silently handle errors
      }
    };

    fetchGuildNickname();
  }, [session?.user?.id]);

  // Main update effect
  useEffect(() => {
    if (!session?.user) return;

    const currentTime = Date.now();
    const userId = session.user.id;
    const timeSinceLastUpdate = currentTime - updateTimeRef.current;

    // Only update if page is visible and enough time has passed
    if (document.hidden) return;
    
    const shouldUpdate =
      lastUpdateRef.current !== userId ||
      timeSinceLastUpdate > 1800000 || // 30 minutes
      (timeSinceLastUpdate > 600000 && pathname); // 10 minutes + navigation (increased from 5)

    if (shouldUpdate) {
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
              nickname:
                guildNickname || session.user.nickname || session.user.name,
              // Always update team member info
              updateTeamInfo: true,
              // Force refresh from Discord API (use sparingly due to rate limits)
              forceDiscordRefresh: timeSinceLastUpdate > 1800000,
            }),
          });

        } catch (error) {
          // Silently handle errors
        }
      };

      updatePlayerData();
    }
    // Include pathname in dependencies to trigger updates on navigation
  }, [session?.user?.id, session?.user, guildNickname, pathname]);

  return null;
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
