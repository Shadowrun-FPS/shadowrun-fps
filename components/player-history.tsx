"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import { ModerationAction, Player, Ban } from "@/types/moderation";
import { format } from "date-fns";
import { safeLog } from "@/lib/security";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface PlayerHistoryProps {
  playerId: string;
}

const MODERATION_EMPTY_STATE_VARIANTS = [
  {
    title: "Certified drama-free",
    body: "Zero warnings, zero bans—this file is so empty we're legally obligated to assume they’re either a saint or very good at flying under the radar.",
  },
  {
    title: "Squeaky clean",
    body: "Not a single strike on record. If good behavior were a stat, they’d be min-maxing it. Respect.",
  },
  {
    title: "Nothing to see here (in a good way)",
    body: "No moderation history means no stories for the campfire. That’s the boring, beautiful kind of boring we like.",
  },
  {
    title: "Hall of fame material",
    body: "Clean sheet from top to bottom. The mods have had nothing to write home about—except maybe “please send more players like this one.”",
  },
  {
    title: "Gold star energy",
    body: "This account hasn’t given the moderation team a single homework assignment. We&aposre not crying, you’re crying.",
  },
] as const;

// Define types for history items
interface HistoryItem {
  _id: string;
  type: string;
  reason: string;
  rule?: string;
  moderatorId?: string;
  moderatorName: string;
  moderatorNickname?: string;
  moderatorProfilePicture?: string | null;
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
  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch player data
      const playerResponse = await fetch(`/api/admin/players/${playerId}`);
      let playerData: ExtendedPlayer | null = null;
      if (!playerResponse.ok) {
        let message = `Request failed (${playerResponse.status})`;
        try {
          const errJson = await playerResponse.json();
          if (typeof errJson?.error === "string") {
            message = errJson.error;
          }
        } catch {
          /* ignore */
        }
        throw new Error(message);
      }
      playerData = await playerResponse.json();
      setPlayer(playerData);

      // Create history from player document only
      let combinedHistory: HistoryItem[] = [];

      // Collect all moderator IDs to fetch Discord info
      const moderatorIds = new Set<string>();
      
      // Add warnings from player document
      if (playerData?.warnings && playerData.warnings.length > 0) {

        playerData.warnings.forEach((warning: any) => {
          if (warning.moderatorId) {
            moderatorIds.add(warning.moderatorId);
          }
        });
      }

      // Add bans from player document
      if (playerData?.bans && playerData.bans.length > 0) {

        playerData.bans.forEach((ban: any) => {
          if (ban.moderatorId) {
            moderatorIds.add(ban.moderatorId);
          }
        });
      }

      // Fetch Discord user info for all moderators
      const moderatorDiscordInfo = new Map<string, any>();
      if (moderatorIds.size > 0) {
        try {
          const response = await fetch(
            `/api/discord/user-info-batch?ids=${Array.from(moderatorIds).join(",")}`
          );
          if (response.ok) {
            const data = await response.json();
            data.forEach((info: any) => {
              if (info.discordId) {
                moderatorDiscordInfo.set(info.discordId, info);
              }
            });
          }
        } catch (error) {
          safeLog.error("Error fetching moderator Discord info:", error);
        }
      }

      // Add warnings from player document
      if (playerData?.warnings && playerData.warnings.length > 0) {
        const warningHistory: HistoryItem[] = playerData.warnings.map(
          (warning: any) => {
            const modInfo = warning.moderatorId
              ? moderatorDiscordInfo.get(warning.moderatorId)
              : null;

            return {
              _id: warning._id || `warning-${Date.now()}-${Math.random()}`,
              type: "warning",
              reason: warning.reason || "No reason provided",
              rule: warning.rule || "",
              moderatorId: warning.moderatorId,
              moderatorName: modInfo
                ? modInfo.nickname || modInfo.username
                : warning.moderatorName || "Unknown",
              moderatorNickname: modInfo?.nickname,
              moderatorProfilePicture: modInfo?.profilePicture || null,
              timestamp: warning.timestamp || warning.createdAt || new Date(),
            };
          }
        );

        combinedHistory = [...combinedHistory, ...warningHistory];
      }

      // Add bans from player document
      if (playerData?.bans && playerData.bans.length > 0) {
        const banHistory: HistoryItem[] = playerData.bans.map((ban: any) => {
          const modInfo = ban.moderatorId
            ? moderatorDiscordInfo.get(ban.moderatorId)
            : null;

          return {
            _id: ban._id || `ban-${Date.now()}-${Math.random()}`,
            type: ban.permanent ? "perm_ban" : "temp_ban",
            reason: ban.reason || "No reason provided",
            rule: ban.rule || "",
            moderatorId: ban.moderatorId,
            moderatorName: modInfo
              ? modInfo.nickname || modInfo.username
              : ban.moderatorName || "Unknown",
            moderatorNickname: modInfo?.nickname,
            moderatorProfilePicture: modInfo?.profilePicture || null,
            timestamp: ban.timestamp || ban.createdAt || new Date(),
            expiry: ban.expiry,
          };
        });

        combinedHistory = [...combinedHistory, ...banHistory];
      }

      // Sort by timestamp, newest first
      combinedHistory.sort((a, b) => {
        const dateA = new Date(a.timestamp || 0).getTime();
        const dateB = new Date(b.timestamp || 0).getTime();
        return dateB - dateA;
      });

      setHistory(combinedHistory);
    } catch (err) {
      safeLog.error("Error fetching player history:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load player history",
      );
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
    return (
      <div className="py-8 text-center text-muted-foreground">
        Loading player history…
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center text-destructive">
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

  const emptyStatePick =
    MODERATION_EMPTY_STATE_VARIANTS[
      playerName
        .split("")
        .reduce((acc, ch, i) => acc + ch.charCodeAt(0) * (i + 1), 0) %
        MODERATION_EMPTY_STATE_VARIANTS.length
    ];

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl">
          {playerName}&apos;s Moderation History
        </h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          A record of warnings and bans associated with this account.
        </p>
      </div>

      {history.length === 0 ? (
        <div
          className="mx-auto max-w-lg rounded-xl  border-border/50 px-6 py-12 text-center shadow-sm"
          role="status"
          aria-label="No moderation history"
        >
         
          <p className="text-lg font-semibold text-foreground">
            {emptyStatePick.title}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {emptyStatePick.body}
          </p>
          <p className="mt-6 text-xs text-muted-foreground/80">
            No warnings or bans are on file for this account.
          </p>
        </div>
      ) : (
        <section className="space-y-4" aria-labelledby="moderation-history-heading">
          <h2
            id="moderation-history-heading"
            className="text-lg font-semibold text-foreground"
          >
            Moderation History
          </h2>
          <div className="overflow-x-auto">
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
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage
                              src={item.moderatorProfilePicture || undefined}
                              alt={item.moderatorName}
                            />
                            <AvatarFallback>
                              {item.moderatorName?.charAt(0)?.toUpperCase() || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <span>
                            {item.moderatorNickname ||
                              item.moderatorName ||
                              "Unknown"}
                          </span>
                        </div>
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
        </section>
      )}

      {player && player.isBanned && (
        <div className="rounded-md border border-red-500/30 bg-red-950/20 p-4">
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
  );
}
