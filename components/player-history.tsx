"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import { ModerationAction, Player, Ban } from "@/types/moderation";
import { formatDate } from "@/lib/utils";

interface PlayerHistoryProps {
  playerId: string;
}

export function PlayerHistory({ playerId }: PlayerHistoryProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<ModerationAction[]>([]);
  const [player, setPlayer] = useState<Player | null>(null);
  const router = useRouter();

  // Add logic to determine if it's a Discord ID
  const isDiscordId = /^\d+$/.test(playerId);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch player data using the ID (which should be a Discord ID)
      const playerResponse = await fetch(`/api/admin/players/${playerId}`);
      if (!playerResponse.ok) {
        throw new Error(`Error: ${playerResponse.status}`);
      }
      const playerData = await playerResponse.json();
      setPlayer(playerData);

      // Fetch history data using the Discord ID
      const historyResponse = await fetch(
        `/api/admin/players/${playerId}/history`
      );
      if (!historyResponse.ok) {
        throw new Error(`Error: ${historyResponse.status}`);
      }

      let historyData = await historyResponse.json();

      // Ensure historyData is an array
      if (!Array.isArray(historyData)) {
        historyData = historyData.history || [];
      }

      // Check if player has an active ban that's not in history
      if (
        playerData.isBanned &&
        playerData.bans &&
        playerData.bans.length > 0
      ) {
        // Find the most recent ban
        const mostRecentBan = playerData.bans.reduce(
          (latest: Ban | null, current: Ban) => {
            if (!latest) return current;

            const latestDate = new Date(latest.timestamp).getTime();
            const currentDate = new Date(current.timestamp).getTime();

            return currentDate > latestDate ? current : latest;
          },
          null
        );

        // Add the ban to history if it's not already there
        if (mostRecentBan) {
          const banExists = historyData.some(
            (action: ModerationAction) =>
              action._id === mostRecentBan._id ||
              (action.timestamp === mostRecentBan.timestamp &&
                action.reason === mostRecentBan.reason)
          );

          if (!banExists) {
            // Log ban data for debugging
            console.log("Adding ban to history:", mostRecentBan);

            // Create the history entry with better fallbacks for moderator info
            historyData.push({
              _id: mostRecentBan._id || `ban-${Date.now()}`,
              type: mostRecentBan.expiry ? "temp_ban" : "perm_ban",
              reason: mostRecentBan.reason || "No reason provided",
              moderatorId: mostRecentBan.moderatorId,
              // Check for moderator info in all possible locations
              moderatorName:
                mostRecentBan.moderatorName ||
                mostRecentBan.moderator?.name ||
                mostRecentBan.createdBy?.name ||
                "Unknown",
              moderatorNickname:
                mostRecentBan.moderatorNickname ||
                mostRecentBan.moderator?.nickname ||
                mostRecentBan.createdBy?.nickname ||
                "",
              playerId: playerId,
              playerName:
                playerData.discordNickname ||
                playerData.discordUsername ||
                "Unknown Player",
              duration: mostRecentBan.duration,
              expiry: mostRecentBan.expiry,
              timestamp: mostRecentBan.timestamp,
            });
          }
        }
      }

      // Sort by timestamp, newest first
      historyData.sort((a: ModerationAction, b: ModerationAction) => {
        return (
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
      });

      setHistory(historyData);
    } catch (err) {
      console.error("Failed to fetch player history:", err);
      setError("Failed to load player history. Please try again.");
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, [playerId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleBack = () => {
    router.back();
  };

  // Format date to match the screenshot format (e.g., "6/15/2023, 7:30:00 AM")
  const formatDateTime = (date: Date): string => {
    return date.toLocaleString("en-US", {
      month: "numeric",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };

  // Format action type as a badge with proper styling
  const renderActionBadge = (action: ModerationAction) => {
    switch (action.type) {
      case "warning":
        return (
          <Badge className="bg-yellow-500 hover:bg-yellow-600">Warning</Badge>
        );
      case "temp_ban":
        return (
          <Badge className="bg-red-500 hover:bg-red-600">
            Temporary Ban
            {action.duration && (
              <span className="ml-1">({action.duration})</span>
            )}
          </Badge>
        );
      case "perm_ban":
        return (
          <Badge className="bg-red-700 hover:bg-red-800">Permanent Ban</Badge>
        );
      case "unban":
        return (
          <Badge className="bg-green-500 hover:bg-green-600">Unbanned</Badge>
        );
      default:
        return <Badge>{action.type}</Badge>;
    }
  };

  if (loading) {
    return <div className="py-8 text-center">Loading player history...</div>;
  }

  if (error) {
    return (
      <div className="py-8 text-center text-red-500">
        {error}
        <Button onClick={fetchHistory} variant="outline" className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  const playerName = player
    ? player.discordNickname || player.discordUsername || "Unknown Player"
    : "Unknown Player";

  return (
    <div>
      <div className="p-6 border rounded-lg bg-card text-card-foreground">
        <h3 className="mb-2 text-xl font-bold">
          {playerName}&apos;s Moderation History
        </h3>
        <p className="mb-6 text-muted-foreground">
          A record of warnings and bans associated with your account.
        </p>

        {history.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            No moderation actions found for this player.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-3 font-medium text-left">Action</th>
                  <th className="px-4 py-3 font-medium text-left">Reason</th>
                  <th className="px-4 py-3 font-medium text-left">Moderator</th>
                  <th className="px-4 py-3 font-medium text-left">Date</th>
                </tr>
              </thead>
              <tbody>
                {history.map((action) => (
                  <tr key={action._id?.toString()} className="border-b">
                    <td className="px-4 py-3">
                      {renderActionBadge(action)}
                      {action.type === "temp_ban" && action.duration && (
                        <div className="mt-1 text-xs text-muted-foreground">
                          Duration: {action.duration}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {action.reason || "No reason provided"}
                    </td>
                    <td className="px-4 py-3">
                      {action.moderatorNickname ||
                        action.moderatorName ||
                        player?.bans?.[0]?.moderatorNickname ||
                        player?.bans?.[0]?.moderatorName ||
                        "Unknown"}
                    </td>
                    <td className="px-4 py-3">
                      {action.timestamp
                        ? formatDateTime(new Date(action.timestamp))
                        : "Unknown"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Display active ban status if present */}
        {player && player.isBanned && (
          <div className="p-4 mt-6 border rounded-md bg-red-950/20 border-red-500/30">
            <p className="font-medium text-red-400">
              This player is currently banned
              {player.banExpiry
                ? ` until ${formatDateTime(new Date(player.banExpiry))}`
                : " permanently"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
