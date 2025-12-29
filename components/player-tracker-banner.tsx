"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import {
  Users,
  Gamepad2,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { safeLocalStorageGet, safeLocalStorageSet } from "@/lib/client-utils";

interface PlayerStats {
  totalOnline: number;
  inMenu: number;
  inGame: number;
  players: Array<{
    status: "menu" | "in-game";
    version: string;
    lastSeen: number;
  }>;
}

interface PlayerTrackerBannerProps {
  apiUrl?: string;
  updateInterval?: number;
  cacheMaxAge?: number; // Cache expiration in milliseconds (default: 5 minutes)
}

type LoadingState = "loading" | "success" | "error";

interface WidgetState {
  stats: PlayerStats | null;
  status: LoadingState;
  lastUpdated: Date | null;
  errorCount: number;
}

const CACHE_KEY = "player-stats-cache";
const CACHE_MAX_AGE_DEFAULT = 5 * 60 * 1000; // 5 minutes
const MAX_RETRY_DELAY = 300000; // 5 minutes max retry delay
const INITIAL_RETRY_DELAY = 5000; // 5 seconds initial retry delay

// Validate API response structure
function validatePlayerStats(data: any): data is PlayerStats {
  return (
    data &&
    typeof data === "object" &&
    typeof data.totalOnline === "number" &&
    typeof data.inMenu === "number" &&
    typeof data.inGame === "number" &&
    Array.isArray(data.players) &&
    data.totalOnline >= 0 &&
    data.inMenu >= 0 &&
    data.inGame >= 0
  );
}

export default function PlayerTrackerBanner({
  apiUrl = process.env.NEXT_PUBLIC_PLAYER_TRACKER_API ||
    "https://playertracker-production.up.railway.app",
  updateInterval = 30000,
  cacheMaxAge = CACHE_MAX_AGE_DEFAULT,
}: PlayerTrackerBannerProps) {
  const [state, setState] = useState<WidgetState>({
    stats: null,
    status: "loading",
    lastUpdated: null,
    errorCount: 0,
  });

  const [isClient, setIsClient] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isTabVisible, setIsTabVisible] = useState(true);

  // Track previous stats for trending indicators
  const prevStatsRef = useRef<PlayerStats | null>(null);
  const [onlineTrend, setOnlineTrend] = useState<"up" | "down" | null>(null);
  const [playingTrend, setPlayingTrend] = useState<"up" | "down" | null>(null);
  const [showNotification, setShowNotification] = useState(false);

  // Track retry timeout
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentFetchControllerRef = useRef<AbortController | null>(null);

  // Calculate exponential backoff delay
  const getRetryDelay = useCallback((errorCount: number): number => {
    const delay = Math.min(
      INITIAL_RETRY_DELAY * Math.pow(2, errorCount),
      MAX_RETRY_DELAY
    );
    return delay;
  }, []);

  const fetchStats = useCallback(
    async (isManualRefresh = false) => {
      // If manual refresh, cancel any in-flight request
      if (isManualRefresh && currentFetchControllerRef.current) {
        currentFetchControllerRef.current.abort();
      }

      // Clear any pending retry when manually refreshing
      if (isManualRefresh && retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }

      if (isManualRefresh) {
        setIsRefreshing(true);
      }

      const controller = new AbortController();
      currentFetchControllerRef.current = controller;
      const timeoutId = setTimeout(() => controller.abort(), 10000); // Increased timeout to 10s

      try {
        const response = await fetch(`${apiUrl}/api/stats`, {
          signal: controller.signal,
          cache: "no-store", // Prevent browser caching
          mode: "cors", // Explicitly allow CORS
          credentials: "omit", // Don't send credentials for external API
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Validate response structure
        if (!validatePlayerStats(data)) {
          throw new Error("Invalid API response structure");
        }

        // Detect changes and show trending indicators
        if (prevStatsRef.current) {
          const prevOnline = prevStatsRef.current.totalOnline;
          const prevPlaying = prevStatsRef.current.inGame;

          // Online trending
          if (data.totalOnline > prevOnline) {
            setOnlineTrend("up");
            setShowNotification(true);
            setTimeout(() => {
              setOnlineTrend(null);
              setShowNotification(false);
            }, 3000);
          } else if (data.totalOnline < prevOnline) {
            setOnlineTrend("down");
            setTimeout(() => setOnlineTrend(null), 3000);
          }

          // Playing trending
          if (data.inGame > prevPlaying) {
            setPlayingTrend("up");
            setTimeout(() => setPlayingTrend(null), 3000);
          } else if (data.inGame < prevPlaying) {
            setPlayingTrend("down");
            setTimeout(() => setPlayingTrend(null), 3000);
          }
        }

        // Update ref for next comparison
        prevStatsRef.current = data;

        const newState: WidgetState = {
          stats: data,
          status: "success",
          lastUpdated: new Date(),
          errorCount: 0, // Reset error count on success
        };

        setState(newState);

        // Cache the stats in localStorage
        safeLocalStorageSet(
          CACHE_KEY,
          JSON.stringify({
            stats: data,
            lastUpdated: new Date().toISOString(),
          })
        );

        // Clear any pending retry
        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current);
          retryTimeoutRef.current = null;
        }
      } catch (error) {
        // Don't log errors if the request was aborted (e.g., manual refresh)
        if (error instanceof Error && error.name === "AbortError") {
          // Request was aborted, likely due to manual refresh
          return;
        }

        // Log detailed error information for debugging
        if (process.env.NODE_ENV === "development") {
          console.error("Failed to fetch player stats:", {
            error,
            message: error instanceof Error ? error.message : String(error),
            name: error instanceof Error ? error.name : "Unknown",
            apiUrl: `${apiUrl}/api/stats`,
          });
        }

        // Check for specific error types
        if (
          error instanceof TypeError &&
          error.message.includes("Failed to fetch")
        ) {
          // Network error - could be CORS, blocked by browser, or network issue
          console.warn(
            "Network error - request may be blocked by browser security policy"
          );
        }

        setState((prev) => {
          const newErrorCount = prev.errorCount + 1;
          const retryDelay = getRetryDelay(newErrorCount);

          // Schedule retry with exponential backoff (only if not manual refresh)
          if (!isManualRefresh && isTabVisible) {
            if (retryTimeoutRef.current) {
              clearTimeout(retryTimeoutRef.current);
            }
            retryTimeoutRef.current = setTimeout(() => {
              fetchStats(false);
            }, retryDelay);
          }

          return {
            ...prev,
            status: "error",
            errorCount: newErrorCount,
          };
        });
      } finally {
        // Clear the controller reference if this was the current fetch
        if (currentFetchControllerRef.current === controller) {
          currentFetchControllerRef.current = null;
        }

        if (isManualRefresh) {
          setIsRefreshing(false);
        }
      }
    },
    [apiUrl, getRetryDelay, isTabVisible]
  );

  // Load cached stats from localStorage (client-side only)
  useEffect(() => {
    setIsClient(true);
    const cached = safeLocalStorageGet(CACHE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        const cacheAge = parsed.lastUpdated
          ? Date.now() - new Date(parsed.lastUpdated).getTime()
          : Infinity;

        // Only use cache if it's not expired
        if (cacheAge < cacheMaxAge && validatePlayerStats(parsed.stats)) {
          setState({
            stats: parsed.stats,
            status: "loading",
            lastUpdated: parsed.lastUpdated
              ? new Date(parsed.lastUpdated)
              : null,
            errorCount: 0,
          });
          prevStatsRef.current = parsed.stats;
        }
      } catch {
        // Invalid cache, ignore
      }
    }
  }, [cacheMaxAge]);

  // Handle page visibility (pause polling when tab is hidden)
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabVisible(!document.hidden);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    setIsTabVisible(!document.hidden);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // Main polling effect
  useEffect(() => {
    if (!isClient) return;

    // Initial fetch
    fetchStats();

    // Set up interval (only when tab is visible)
    if (isTabVisible) {
      intervalRef.current = setInterval(() => {
        fetchStats(false);
      }, updateInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      // Abort any in-flight fetch on unmount
      if (currentFetchControllerRef.current) {
        currentFetchControllerRef.current.abort();
      }
    };
  }, [isClient, fetchStats, updateInterval, isTabVisible]);

  // Manual refresh handler
  const handleManualRefresh = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();

      // Don't proceed if already refreshing
      if (isRefreshing) {
        return;
      }

      fetchStats(true);
    },
    [fetchStats, isRefreshing]
  );

  // isOnline now means "API is responding" not "players online"
  const isApiOnline = state.status === "success";
  const hasPlayers = state.stats && state.stats.totalOnline > 0;
  const showError = state.status === "error";

  // Memoize formatted numbers for smooth transitions
  const onlineCount = useMemo(
    () => state.stats?.totalOnline ?? 0,
    [state.stats?.totalOnline]
  );
  const playingCount = useMemo(
    () => state.stats?.inGame ?? 0,
    [state.stats?.inGame]
  );

  return (
    <div className="w-full bg-gradient-to-r from-[#1a1a2e] via-[#16213e] to-[#1a1a2e] border-b border-primary/20 transition-all duration-300">
      <div className="px-2 mx-auto max-w-screen-2xl sm:px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between py-1.5 sm:py-2 gap-2 sm:gap-4">
          {/* Left: Status Indicator + Title + Notification Dot */}
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 relative">
            <div
              className={`w-2 h-2 rounded-full flex-shrink-0 transition-colors duration-300 ${
                isApiOnline
                  ? "bg-green-500"
                  : showError
                  ? "bg-red-500"
                  : "bg-yellow-500"
              }`}
              aria-label={
                isApiOnline
                  ? "API Online"
                  : showError
                  ? "API Error"
                  : "API Loading"
              }
            />
            <span className="text-xs text-gray-400 truncate sm:text-sm">
              {isApiOnline ? "Online" : showError ? "Error" : "Loading"}
            </span>
            {/* Notification dot when player count increases */}
            {showNotification && hasPlayers && (
              <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full animate-ping bg-primary" />
            )}
            {/* Error indicator */}
            {showError && (
              <AlertCircle
                className="flex-shrink-0 ml-1 w-3 h-3 text-red-400"
                aria-hidden="true"
              />
            )}
          </div>

          {/* Center: Stats - Simplified for mobile */}
          <div className="flex gap-2 items-center sm:gap-4">
            {/* Total Online */}
            <div
              className="flex items-center gap-1.5 sm:gap-2 bg-black/30 px-2 sm:px-3 py-1 rounded border border-primary/30 transition-all duration-500 hover:bg-black/40 hover:border-primary/50 relative cursor-default"
              title={`${onlineCount} players online${
                state.stats ? ` (${state.stats.inMenu} in menu)` : ""
              }`}
            >
              <Users
                className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary flex-shrink-0"
                aria-hidden="true"
              />
              <div className="flex gap-1 items-baseline">
                <span
                  className="text-base font-bold leading-none transition-all duration-300 sm:text-lg text-primary"
                  aria-label={`${onlineCount} players online`}
                >
                  {state.status === "loading" && !state.stats ? (
                    <span className="inline-block w-4 h-4 rounded animate-pulse bg-primary/50" />
                  ) : (
                    onlineCount
                  )}
                </span>
                <span className="text-[10px] sm:text-xs text-gray-400 leading-none">
                  online
                </span>
              </div>
              {/* Trending indicator */}
              {onlineTrend && (
                <div
                  className="absolute -top-1 -right-1 duration-300 animate-in fade-in slide-in-from-bottom-2"
                  aria-hidden="true"
                >
                  {onlineTrend === "up" ? (
                    <TrendingUp className="w-3 h-3 text-green-400" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-red-400" />
                  )}
                </div>
              )}
            </div>

            {/* In Game */}
            <div
              className="flex items-center gap-1.5 sm:gap-2 bg-black/30 px-2 sm:px-3 py-1 rounded border border-green-500/30 transition-all duration-500 hover:bg-black/40 hover:border-green-500/50 relative cursor-default"
              title={`${playingCount} players in game`}
            >
              <Gamepad2
                className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500 flex-shrink-0"
                aria-hidden="true"
              />
              <div className="flex gap-1 items-baseline">
                <span
                  className="text-base font-bold leading-none text-green-500 transition-all duration-300 sm:text-lg"
                  aria-label={`${playingCount} players in game`}
                >
                  {state.status === "loading" && !state.stats ? (
                    <span className="inline-block w-4 h-4 rounded animate-pulse bg-green-500/50" />
                  ) : (
                    playingCount
                  )}
                </span>
                <span className="text-[10px] sm:text-xs text-gray-400 leading-none">
                  playing
                </span>
              </div>
              {/* Trending indicator */}
              {playingTrend && (
                <div
                  className="absolute -top-1 -right-1 duration-300 animate-in fade-in slide-in-from-bottom-2"
                  aria-hidden="true"
                >
                  {playingTrend === "up" ? (
                    <TrendingUp className="w-3 h-3 text-green-400" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-red-400" />
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right: Last Updated + Refresh Button */}
          <div className="hidden gap-2 items-center min-w-0 md:flex">
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="p-1 rounded transition-colors hover:bg-black/30 disabled:opacity-50 disabled:cursor-wait"
              aria-label={
                isRefreshing
                  ? "Refreshing player stats..."
                  : "Refresh player stats"
              }
              title={isRefreshing ? "Refreshing..." : "Refresh player stats"}
              type="button"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 text-gray-400 transition-all ${
                  isRefreshing ? "animate-spin" : "hover:text-gray-300"
                }`}
                aria-hidden="true"
              />
            </button>
            <span
              className="text-xs text-gray-500 truncate"
              aria-live="polite"
              aria-atomic="true"
            >
              {state.lastUpdated?.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }) ?? "--:--"}
            </span>
          </div>
        </div>
      </div>
      {/* Screen reader announcements */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {isApiOnline && state.stats && (
          <span>
            {state.stats.totalOnline} players online, {state.stats.inGame}{" "}
            playing
          </span>
        )}
        {showError && <span>Unable to fetch player statistics</span>}
      </div>
    </div>
  );
}
