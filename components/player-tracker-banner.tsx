"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Users, Gamepad2, TrendingUp, TrendingDown } from "lucide-react";

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
}

type LoadingState = "loading" | "success" | "error";

interface WidgetState {
  stats: PlayerStats | null;
  status: LoadingState;
  lastUpdated: Date | null;
}

export default function PlayerTrackerBanner({
  apiUrl = process.env.NEXT_PUBLIC_PLAYER_TRACKER_API || "https://playertracker-production.up.railway.app",
  updateInterval = 30000,
}: PlayerTrackerBannerProps) {
  const [state, setState] = useState<WidgetState>({
    stats: null,
    status: "loading",
    lastUpdated: null,
  });

  const [isClient, setIsClient] = useState(false);

  // Track previous stats for trending indicators
  const prevStatsRef = useRef<PlayerStats | null>(null);
  const [onlineTrend, setOnlineTrend] = useState<"up" | "down" | null>(null);
  const [playingTrend, setPlayingTrend] = useState<"up" | "down" | null>(null);
  const [showNotification, setShowNotification] = useState(false);

  const fetchStats = useCallback(async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch(`${apiUrl}/api/stats`, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: PlayerStats = await response.json();

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

      const newState = {
        stats: data,
        status: "success" as LoadingState,
        lastUpdated: new Date(),
      };

      setState(newState);

      // Cache the stats in localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem(
          "player-stats-cache",
          JSON.stringify({
            stats: data,
            lastUpdated: new Date().toISOString(),
          })
        );
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Failed to fetch player stats:", error);
      }
      setState((prev) => ({
        ...prev,
        status: "error",
      }));
    }
  }, [apiUrl]);

  // Load cached stats from localStorage (client-side only)
  useEffect(() => {
    setIsClient(true);
    const cached = localStorage.getItem("player-stats-cache");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setState({
          stats: parsed.stats,
          status: "loading" as LoadingState,
          lastUpdated: parsed.lastUpdated ? new Date(parsed.lastUpdated) : null,
        });
        prevStatsRef.current = parsed.stats;
      } catch {
        // Invalid cache, ignore
      }
    }
  }, []);

  useEffect(() => {
    if (!isClient) return;
    fetchStats();
    const intervalId = setInterval(fetchStats, updateInterval);
    return () => clearInterval(intervalId);
  }, [isClient, fetchStats, updateInterval]);

  // isOnline now means "API is responding" not "players online"
  const isApiOnline = state.status === "success";
  const hasPlayers = state.stats && state.stats.totalOnline > 0;

  return (
    <div className="w-full bg-gradient-to-r from-[#1a1a2e] via-[#16213e] to-[#1a1a2e] border-b border-primary/20 transition-all duration-300">
      <div className="max-w-screen-2xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between py-1.5 sm:py-2 gap-2 sm:gap-4">
          {/* Left: Status Indicator + Title + Notification Dot */}
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 relative">
            <div
              className={`w-2 h-2 rounded-full flex-shrink-0 transition-colors duration-300 ${
                isApiOnline ? "bg-green-500" : "bg-red-500"
              }`}
              aria-label={isApiOnline ? "API Online" : "API Offline"}
            />
            <span className="text-xs sm:text-sm text-gray-400 truncate">
              {isApiOnline ? "Online" : "Offline"}
            </span>
            {/* Notification dot when player count increases */}
            {showNotification && hasPlayers && (
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full animate-ping" />
            )}
          </div>

          {/* Center: Stats - Simplified for mobile */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Total Online */}
            <div className="flex items-center gap-1.5 sm:gap-2 bg-black/30 px-2 sm:px-3 py-1 rounded border border-primary/30 transition-all duration-500 hover:bg-black/40 hover:border-primary/50 relative">
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary flex-shrink-0" />
              <div className="flex items-baseline gap-1">
                <span className="text-base sm:text-lg font-bold text-primary leading-none animate-in fade-in duration-500">
                  {state.stats?.totalOnline ?? 0}
                </span>
                <span className="text-[10px] sm:text-xs text-gray-400 leading-none">
                  online
                </span>
              </div>
              {/* Trending indicator */}
              {onlineTrend && (
                <div className="absolute -top-1 -right-1 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  {onlineTrend === "up" ? (
                    <TrendingUp className="w-3 h-3 text-green-400" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-red-400" />
                  )}
                </div>
              )}
            </div>

            {/* In Game */}
            <div className="flex items-center gap-1.5 sm:gap-2 bg-black/30 px-2 sm:px-3 py-1 rounded border border-green-500/30 transition-all duration-500 hover:bg-black/40 hover:border-green-500/50 relative">
              <Gamepad2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" />
              <div className="flex items-baseline gap-1">
                <span className="text-base sm:text-lg font-bold text-green-500 leading-none animate-in fade-in duration-500">
                  {state.stats?.inGame ?? 0}
                </span>
                <span className="text-[10px] sm:text-xs text-gray-400 leading-none">
                  playing
                </span>
              </div>
              {/* Trending indicator */}
              {playingTrend && (
                <div className="absolute -top-1 -right-1 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  {playingTrend === "up" ? (
                    <TrendingUp className="w-3 h-3 text-green-400" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-red-400" />
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right: Last Updated (desktop only) */}
          <div className="hidden md:flex items-center min-w-0">
            <span className="text-xs text-gray-500 truncate">
              {state.lastUpdated?.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }) ?? "--:--"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

