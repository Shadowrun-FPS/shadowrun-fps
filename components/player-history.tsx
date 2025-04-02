"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import { ModerationAction, Player, Ban } from "@/types/moderation";
import { formatDate } from "@/lib/utils";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

interface PlayerHistoryProps {
  playerId: string;
}

// Define types for history items
interface HistoryItem {
  _id: string;
  type: string;
  reason: string;
  rule?: string;
  moderatorName: string;
  moderatorNickname?: string;
  timestamp: Date | string;
  expiry?: Date | string;
}

// Add missing properties to the Player type
type ExtendedPlayer = Player & {
  banExpiry?: string | Date;
  warnings?: any[];
  bans?: any[];
};

export function PlayerHistory({ playerId }: PlayerHistoryProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [player, setPlayer] = useState<ExtendedPlayer | null>(null);
  const router = useRouter();

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch player data
      const playerResponse = await fetch(`/api/admin/players/${playerId}`);
      if (!playerResponse.ok) {
        throw new Error(`Error: ${playerResponse.status}`);
      }
      const playerData = await playerResponse.json();
      setPlayer(playerData);

      console.log("Player data:", playerData);

      // Create history from player document only
      let combinedHistory: HistoryItem[] = [];

      // Add warnings from player document
      if (playerData.warnings && playerData.warnings.length > 0) {
        console.log("Player warnings:", playerData.warnings);

        const warningHistory: HistoryItem[] = playerData.warnings.map(
          (warning: any) => ({
            _id: warning._id || `warning-${Date.now()}-${Math.random()}`,
            type: "warning",
            reason: warning.reason || "No reason provided",
            rule: warning.rule || "",
            moderatorName: warning.moderatorName || "Unknown",
            moderatorNickname: warning.moderatorNickname || "",
            timestamp: warning.timestamp || warning.createdAt || new Date(),
          })
        );

        combinedHistory = [...combinedHistory, ...warningHistory];
      }

      // Add bans from player document
      if (playerData.bans && playerData.bans.length > 0) {
        console.log("Player bans:", playerData.bans);

        const banHistory: HistoryItem[] = playerData.bans.map((ban: any) => ({
          _id: ban._id || `ban-${Date.now()}-${Math.random()}`,
          type: ban.permanent ? "perm_ban" : "temp_ban",
          reason: ban.reason || "No reason provided",
          rule: ban.rule || "",
          moderatorName: ban.moderatorName || "Unknown",
          moderatorNickname: ban.moderatorNickname || "",
          timestamp: ban.timestamp || ban.createdAt || new Date(),
          expiry: ban.expiry,
        }));

        combinedHistory = [...combinedHistory, ...banHistory];
      }

      // Sort by timestamp, newest first
      combinedHistory.sort((a, b) => {
        const dateA = new Date(a.timestamp || 0).getTime();
        const dateB = new Date(b.timestamp || 0).getTime();
        return dateB - dateA;
      });

      console.log("Combined history from player document:", combinedHistory);
      setHistory(combinedHistory);
    } catch (err) {
      console.error("Error fetching player history:", err);
      setError("Failed to load player history");
    } finally {
      setLoading(false);
    }
  }, [playerId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const getReasonDisplay = (reason: string) => {
    if (!reason) return "No reason provided";

    const isTooLong = reason.length > 50;

    if (isTooLong) {
      return (
        <HoverCard>
          <HoverCardTrigger asChild>
            <span className="cursor-help underline-offset-2 hover:underline">
              {reason.substring(0, 50)}...
            </span>
          </HoverCardTrigger>
          <HoverCardContent className="p-4 w-80">
            <p className="text-sm">{reason}</p>
          </HoverCardContent>
        </HoverCard>
      );
    }

    return reason;
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
          A record of warnings and bans associated with this account.
        </p>

        {history.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            No moderation actions found for this player.
          </div>
        ) : (
          <div className="space-y-4 overflow-x-auto">
            <h2 className="text-xl font-bold">Moderation History</h2>
            <div className="min-w-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24">Action</TableHead>
                    <TableHead className="w-1/3">Reason</TableHead>
                    <TableHead className="w-1/6">Rule</TableHead>
                    <TableHead className="w-1/6">Moderator</TableHead>
                    <TableHead className="w-1/6">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((item, index) => (
                    <TableRow key={`${item._id || index}`}>
                      <TableCell className="whitespace-nowrap">
                        <Badge
                          className={
                            item.type === "temp_ban" || item.type === "perm_ban"
                              ? "bg-destructive text-destructive-foreground"
                              : item.type === "warning"
                              ? "bg-yellow-500 text-black"
                              : ""
                          }
                        >
                          {item.type === "temp_ban"
                            ? "Temporary Ban"
                            : item.type === "perm_ban"
                            ? "Permanent Ban"
                            : item.type === "warning"
                            ? "Warning"
                            : item.type === "unban"
                            ? "Unbanned"
                            : item.type || "Unknown"}
                        </Badge>
                      </TableCell>
                      <TableCell>{getReasonDisplay(item.reason)}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {item.rule || "N/A"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {item.moderatorNickname ||
                          item.moderatorName ||
                          "Unknown"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {item.timestamp
                          ? format(
                              new Date(item.timestamp),
                              "MM/dd/yyyy, h:mm a"
                            )
                          : "Unknown date"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Display active ban status if present */}
        {player && player.isBanned && (
          <div className="p-4 mt-6 border rounded-md bg-red-950/20 border-red-500/30">
            <p className="font-medium text-red-400">
              This player is currently banned
              {player.banExpiry
                ? ` until ${format(
                    new Date(player.banExpiry),
                    "MM/dd/yyyy, h:mm a"
                  )}`
                : " permanently"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
