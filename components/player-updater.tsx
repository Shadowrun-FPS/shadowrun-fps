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
  // ✅ Use unified endpoint or deduplicated fetch to prevent duplicate calls
  useEffect(() => {
    if (!session?.user?.id) return;
    // Only fetch if page is visible
    if (document.hidden) return;

    const fetchGuildNickname = async () => {
      try {
        // ✅ Try unified endpoint first (includes guild nickname)
        const { deduplicatedFetch } = await import("@/lib/request-deduplication");
        
        // Use unified endpoint which already has guild nickname
        const userData = await deduplicatedFetch<{
          guildNickname: string | null;
        }>("/api/user/data", {
          ttl: 60000, // Cache for 1 minute
        }).catch(() => null);

        if (userData?.guildNickname !== undefined) {
          setGuildNickname(userData.guildNickname);
          return;
        }

        // Fallback to dedicated endpoint if unified fails
        const response = await deduplicatedFetch<{ guildNickname: string | null }>(
          `/api/discord/guild-nickname?userId=${session.user.id}`,
          { ttl: 60000 }
        );
        setGuildNickname(response.guildNickname || null);
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
    const isFirstLoad = lastUpdateRef.current !== userId;

    // Only update if page is visible and enough time has passed
    if (document.hidden) return;
    
    // ✅ Optimize: On first load, wait a bit to let /api/user/data complete first
    // Skip immediate refresh on first load - let user/data handle initial display
    const shouldUpdate =
      (!isFirstLoad && timeSinceLastUpdate > 1800000) || // 30 minutes (not first load)
      (!isFirstLoad && timeSinceLastUpdate > 600000 && pathname); // 10 minutes + navigation

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
    } else if (isFirstLoad) {
      // On first load, just set the refs but don't refresh yet
      // This prevents the immediate refresh call on page load
      lastUpdateRef.current = userId;
      updateTimeRef.current = currentTime;
      
      // Schedule a delayed refresh (after 2 minutes) to sync data in background
      setTimeout(() => {
        if (lastUpdateRef.current === userId && !document.hidden) {
          fetch("/api/players/refresh-discord-data", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              nickname:
                guildNickname || session.user.nickname || session.user.name,
              updateTeamInfo: true,
              forceDiscordRefresh: false, // Don't force Discord API call on delayed refresh
            }),
          }).catch(() => {
            // Silently handle errors
          });
        }
      }, 120000); // 2 minutes delay
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
