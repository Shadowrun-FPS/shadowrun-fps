"use client";

import { useState, useEffect, useCallback } from "react";
import { formatTimeAgo } from "@/lib/utils";
import { ModerationAction } from "@/types/moderation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Ban, AlertTriangle, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { safeLog } from "@/lib/security";

function mapLogToModerationAction(
  log: Record<string, unknown>,
): ModerationAction {
  const action = typeof log.action === "string" ? log.action : "";
  let type: ModerationAction["type"] = "warning";
  if (action === "warn") {
    type = "warning";
  } else if (action === "unban") {
    type = "unban";
  } else if (action === "ban") {
    const duration =
      typeof log.duration === "string" ? log.duration : undefined;
    const perm =
      !duration ||
      /^permanent$/i.test(duration) ||
      /^perm/i.test(duration);
    type = perm ? "perm_ban" : "temp_ban";
  }

  return {
    _id: String(log._id ?? ""),
    type,
    reason: typeof log.reason === "string" ? log.reason : "",
    moderatorId: typeof log.moderatorId === "string" ? log.moderatorId : "",
    moderatorName:
      typeof log.moderatorName === "string" ? log.moderatorName : "",
    moderatorNickname:
      typeof log.moderatorNickname === "string"
        ? log.moderatorNickname
        : undefined,
    playerName: typeof log.playerName === "string" ? log.playerName : "",
    playerId: typeof log.playerId === "string" ? log.playerId : "",
    duration: typeof log.duration === "string" ? log.duration : undefined,
    expiry: log.expiry as ModerationAction["expiry"],
    timestamp: (log.timestamp as string) ?? "",
    playerProfilePicture:
      typeof log.playerProfilePicture === "string"
        ? log.playerProfilePicture
        : null,
    moderatorProfilePicture:
      typeof log.moderatorProfilePicture === "string"
        ? log.moderatorProfilePicture
        : null,
  };
}

export function ModerationLogs() {
  const [logs, setLogs] = useState<ModerationAction[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/moderation-logs?limit=500");
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      const data: unknown = await response.json();
      const raw = Array.isArray(data)
        ? data
        : data &&
            typeof data === "object" &&
            "logs" in data &&
            Array.isArray((data as { logs: unknown[] }).logs)
          ? (data as { logs: Record<string, unknown>[] }).logs
          : [];
      setLogs(
        raw.map((row) =>
          mapLogToModerationAction(row as Record<string, unknown>),
        ),
      );
    } catch (error) {
      safeLog.error("Failed to fetch moderation logs:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchLogs();
  }, [fetchLogs]);

  // Filter logs based on search query
  const filteredLogs = logs.filter((log) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      log.playerName?.toLowerCase().includes(searchLower) ||
      log.moderatorName?.toLowerCase().includes(searchLower) ||
      log.reason?.toLowerCase().includes(searchLower) ||
      log.type?.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return <div className="text-center py-8">Loading moderation logs...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>Player</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Moderator</TableHead>
              <TableHead>Reason</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No moderation logs found
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((log: any) => (
                <TableRow key={log._id.toString()}>
                  <TableCell className="whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage
                          src={log.playerProfilePicture || undefined}
                          alt={log.playerName}
                        />
                        <AvatarFallback>
                          {log.playerName?.charAt(0)?.toUpperCase() || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <span>{log.playerName}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <ActionBadge type={log.type} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage
                          src={log.moderatorProfilePicture || undefined}
                          alt={log.moderatorName}
                        />
                        <AvatarFallback>
                          {log.moderatorName?.charAt(0)?.toUpperCase() || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <span>{log.moderatorName}</span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {log.reason}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            No moderation logs found
          </div>
        ) : (
          filteredLogs.map((log: any) => (
            <Card key={log._id.toString()}>
              <CardHeader className="p-4 pb-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={log.playerProfilePicture || undefined}
                        alt={log.playerName}
                      />
                      <AvatarFallback>
                        {log.playerName?.charAt(0)?.toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <CardTitle className="text-base">{log.playerName}</CardTitle>
                  </div>
                  <ActionBadge type={log.type} />
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-2">
                <div className="text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    {formatTimeAgo(new Date(log.timestamp))} •
                    <div className="flex items-center gap-1">
                      <Avatar className="h-4 w-4">
                        <AvatarImage
                          src={log.moderatorProfilePicture || undefined}
                          alt={log.moderatorName}
                        />
                        <AvatarFallback className="text-[8px]">
                          {log.moderatorName?.charAt(0)?.toUpperCase() || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="ml-1 font-medium">
                        By {log.moderatorName}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2">{log.reason}</div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

function ActionBadge({ type }: { type: string }) {
  switch (type) {
    case "warning":
      return (
        <Badge
          variant="outline"
          className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-amber-500/20"
        >
          <AlertTriangle className="mr-1 h-3 w-3" />
          Warning
        </Badge>
      );
    case "temp_ban":
      return (
        <Badge
          variant="outline"
          className="bg-red-500/10 text-red-600 hover:bg-red-500/20 border-red-500/20"
        >
          <Ban className="mr-1 h-3 w-3" />
          Temporary Ban
        </Badge>
      );
    case "perm_ban":
      return (
        <Badge variant="destructive">
          <Ban className="mr-1 h-3 w-3" />
          Permanent Ban
        </Badge>
      );
    case "unban":
      return (
        <Badge
          variant="outline"
          className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border-blue-500/20"
        >
          <Check className="mr-1 h-3 w-3" />
          Unban
        </Badge>
      );
    default:
      return <Badge variant="outline">{type}</Badge>;
  }
}
