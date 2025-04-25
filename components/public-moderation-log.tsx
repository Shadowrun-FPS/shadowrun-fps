"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";
import { AlertTriangle, Ban, Check, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Loader2 } from "lucide-react";

interface ModerationLog {
  _id: string;
  action: string;
  playerName: string;
  reason: string;
  duration: string;
  timestamp: string;
  expiry?: string;
}

// Add these styles to your CSS file or use inline styles
const blurredStyle = {
  filter: "blur(4px)",
  transition: "filter 0.2s ease-in-out",
};

const hoverStyle = {
  filter: "blur(0)",
};

// Add this CSS class to your module or global CSS
// .player-name-blur {
//   filter: blur(4px);
//   transition: filter 0.2s ease-in-out;
// }
//
// .player-name-blur:hover {
//   filter: blur(0);
// }

export default function PublicModerationLog() {
  const [logs, setLogs] = useState<ModerationLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<ModerationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredLogs(logs);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredLogs(
        logs.filter(
          (log) =>
            log.playerName.toLowerCase().includes(query) ||
            log.reason.toLowerCase().includes(query) ||
            log.duration.toLowerCase().includes(query)
        )
      );
    }
  }, [logs, searchQuery]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/moderation/logs?limit=100");
      if (!response.ok) throw new Error("Failed to fetch moderation logs");

      const data = await response.json();
      setLogs(data.logs || []);
      setFilteredLogs(data.logs || []);
    } catch (error) {
      console.error("Error fetching moderation logs:", error);
    } finally {
      setLoading(false);
    }
  };

  // Function to get action badge based on action type
  const getActionBadge = (action: string) => {
    switch (action) {
      case "warn":
        return (
          <Badge className="text-white border-0 bg-amber-500 hover:bg-amber-600">
            Warning
          </Badge>
        );
      case "ban":
        return (
          <Badge className="text-white bg-red-500 border-0 hover:bg-red-600">
            Ban
          </Badge>
        );
      case "unban":
        return (
          <Badge className="text-white bg-green-500 border-0 hover:bg-green-600">
            Unban
          </Badge>
        );
      default:
        return (
          <Badge className="text-white bg-gray-500 border-0 hover:bg-gray-600">
            {action}
          </Badge>
        );
    }
  };

  // Get ban status based on action and expiry
  const getBanStatus = (log: ModerationLog) => {
    if (log.action !== "ban") return null;

    if (log.duration === "Permanent") {
      return "Permanent";
    }

    if (log.expiry) {
      const expiryDate = new Date(log.expiry);
      const now = new Date();

      if (expiryDate > now) {
        return `Expires: ${format(expiryDate, "MMMM d, yyyy")}`;
      } else {
        return "Expired";
      }
    }

    return null;
  };

  return (
    <div className="container py-8 mx-auto space-y-6">
      <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
        <h1 className="text-2xl font-bold">Community Moderation Log</h1>
        <div className="relative w-full md:w-auto md:min-w-[300px]">
          <Search className="absolute w-4 h-4 text-muted-foreground left-3 top-3" />
          <Input
            type="text"
            placeholder="Search by player or reason..."
            className="h-10 pr-4 pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-hidden border rounded-md">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>Player</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-24 text-center text-muted-foreground"
                    >
                      No moderation actions found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log._id}>
                      <TableCell>{getActionBadge(log.action)}</TableCell>
                      <TableCell className="font-medium">
                        {/* Player name with blur effect */}
                        <span className="inline-block transition-all duration-200 cursor-default blur-sm hover:blur-none">
                          {log.playerName}
                        </span>
                      </TableCell>
                      <TableCell>
                        {log.reason || "No reason provided"}
                      </TableCell>
                      <TableCell>
                        <div>{log.duration}</div>
                        {getBanStatus(log) && (
                          <div className="text-xs text-muted-foreground">
                            {getBanStatus(log)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {format(new Date(log.timestamp), "MMMM d, yyyy")}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <div className="text-sm text-center text-muted-foreground">
        <p>
          This log shows public moderation actions taken by our team to maintain
          community standards.
        </p>
      </div>
    </div>
  );
}
