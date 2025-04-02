"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Activity,
  AlertTriangle,
  Ban,
  Check,
  ChevronDown,
  ExternalLink,
  Eye,
  Filter,
  History,
  Loader2,
  RefreshCw,
  Search,
  Shield,
  X,
} from "lucide-react";
import { cn, formatTimeAgo } from "@/lib/utils";
import { DisputeReviewDialog } from "@/components/dispute-review-dialog";
import { useToast } from "@/components/ui/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import styles from "./page.module.css";

interface ModerationLog {
  _id: string;
  action: string;
  playerId: string;
  playerName: string;
  playerNickname: string;
  moderatorId: string;
  moderatorName: string;
  reason: string;
  timestamp: string;
  duration?: string;
  expiry?: string;
  hasDispute?: boolean;
}

interface Dispute {
  _id: string;
  moderationLogId: string;
  playerDiscordId: string;
  playerName: string;
  playerId: string;
  reason: string;
  status: "pending" | "approved" | "denied";
  createdAt: string;
  moderationAction: {
    _id: string;
    type: "warning" | "temp_ban" | "perm_ban" | "unban";
    playerId: string;
    playerName: string;
    reason: string;
    duration: string;
    active: boolean;
    moderatorId: string;
    moderatorName: string;
    timestamp: string;
  };
}

interface ModerationStat {
  current: number;
  change: number;
}

interface ModerationStats {
  warnings: ModerationStat;
  activeBans: ModerationStat;
  totalActions: ModerationStat;
}

type FilterType = "all" | "warnings" | "bans" | "active";

export default function ModerationPage() {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<ModerationLog[]>([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [activeActions, setActiveActions] = useState<ModerationLog[]>([]);
  const [recentActions, setRecentActions] = useState<ModerationLog[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [disputeDialogOpen, setDisputeDialogOpen] = useState(false);
  const [stats, setStats] = useState({
    warnings: 0,
    activeBans: 0,
    totalActions: 0,
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Use the correct API endpoint path
      const response = await fetch("/api/admin/moderation-logs");

      if (!response.ok) {
        console.error(`API error: ${response.status} ${response.statusText}`);
        const errorText = await response.text();
        console.error(`Error details: ${errorText}`);
        throw new Error("Failed to fetch moderation logs");
      }

      const data = await response.json();
      console.log("Fetched moderation logs:", data.length);
      setLogs(data);

      // Create a map of player IDs to their latest unban action timestamp
      const unbanMap = new Map();
      data.forEach((log: ModerationLog) => {
        if (log.action === "unban") {
          const existingTimestamp = unbanMap.get(log.playerId);
          const currentTimestamp = new Date(log.timestamp).getTime();

          if (!existingTimestamp || currentTimestamp > existingTimestamp) {
            unbanMap.set(log.playerId, currentTimestamp);
          }
        }
      });

      // Filter active bans - exclude any ban that has a more recent unban action
      const activeBansFiltered = data.filter((log: ModerationLog) => {
        if (log.action !== "ban") return false;

        const banTimestamp = new Date(log.timestamp).getTime();
        const unbanTimestamp = unbanMap.get(log.playerId);

        // If there's an unban action after this ban, it's not active
        if (unbanTimestamp && unbanTimestamp > banTimestamp) {
          return false;
        }

        // Check expiry if it exists
        if (log.expiry && new Date(log.expiry) < new Date()) {
          return false;
        }

        return true;
      });

      console.log("Active bans count:", activeBansFiltered.length);
      setActiveActions(activeBansFiltered);
      setRecentActions(data.slice(0, 50));

      // Update stats
      setStats({
        warnings: data.filter((log: ModerationLog) => log.action === "warn")
          .length,
        activeBans: activeBansFiltered.length,
        totalActions: data.length,
      });

      setLoading(false);
    } catch (error) {
      console.error("Error fetching moderation data:", error);
      setLoading(false);
    }
  };

  const getFilteredActions = (actions: ModerationLog[]) => {
    // Filter by search query
    let filtered = actions;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (action) =>
          action.playerName?.toLowerCase().includes(query) ||
          action.moderatorName?.toLowerCase().includes(query) ||
          action.reason?.toLowerCase().includes(query)
      );
    }

    // Filter by action type
    if (filter === "warnings") {
      filtered = filtered.filter((action) => action.action === "warn");
    } else if (filter === "bans") {
      filtered = filtered.filter((action) => action.action === "ban");
    } else if (filter === "active") {
      filtered = filtered.filter(
        (action) =>
          action.action === "ban" &&
          (!action.expiry || new Date(action.expiry) > new Date())
      );
    }

    return filtered;
  };

  const handleUnban = async (playerId: string, playerName: string) => {
    try {
      setLoading(true);
      console.log(`Unbanning player ${playerName}`);

      const response = await fetch(`/api/admin/players/${playerId}/unban`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reason: "Ban removed by administrator",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to unban player");
      }

      // Update the local state to reflect the unban
      setActiveActions((prevActions) =>
        prevActions.map((action) => {
          if (action.playerId === playerId && action.action === "ban") {
            // Mark the ban as inactive but preserve the record
            return { ...action, active: false };
          }
          return action;
        })
      );

      toast({
        title: "Player Unbanned",
        description: `${playerName} has been unbanned successfully.`,
      });

      // Refresh data to show updated state
      fetchData();
    } catch (error) {
      console.error("Error unbanning player:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to unban player",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDisputeResolved = () => {
    // Refresh data after dispute resolution
    fetchData();
    setDisputeDialogOpen(false);
  };

  // Add a function to check if a player is already unbanned
  const isPlayerUnbanned = (playerId: string, action: ModerationLog) => {
    // Check if there's a more recent unban action for this player
    return logs.some(
      (log: ModerationLog) =>
        log.action === "unban" &&
        log.playerId === playerId &&
        new Date(log.timestamp) > new Date(action.timestamp)
    );
  };

  const handleViewDispute = (dispute: Dispute) => {
    // Ensure the status is one of the expected values
    let typedStatus: "pending" | "approved" | "denied" = "pending";
    if (dispute.status === "approved" || dispute.status === "denied") {
      typedStatus = dispute.status;
    }

    // Fix the type comparison issue by using a type assertion
    // This allows us to handle potential API inconsistencies
    const actionType = dispute.moderationAction.type as string;
    const fixedType =
      actionType === "warn" ? "warning" : dispute.moderationAction.type;

    const disputeWithCorrectTypes = {
      ...dispute,
      playerId: dispute.playerId || dispute.playerDiscordId,
      status: typedStatus,
      moderationAction: {
        ...dispute.moderationAction,
        type: fixedType as "warning" | "temp_ban" | "perm_ban" | "unban",
        playerId: dispute.moderationAction.playerId || dispute.playerDiscordId,
        playerName: dispute.moderationAction.playerName || dispute.playerName,
        duration: dispute.moderationAction.duration || "N/A",
        active:
          typeof dispute.moderationAction.active === "boolean"
            ? dispute.moderationAction.active
            : true,
      },
    };

    setSelectedDispute(disputeWithCorrectTypes);
    setDisputeDialogOpen(true);
  };

  // Add a function to get the tab label
  const getTabLabel = (tab: string) => {
    switch (tab) {
      case "overview":
        return "Overview";
      case "active":
        return "Active Bans";
      case "recent":
        return "Recent Actions";
      case "disputes":
        return "Disputes";
      default:
        return "Overview";
    }
  };

  return (
    <div className="container py-6 space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Moderation Panel</h1>
        <p className="text-muted-foreground">
          Manage player warnings, bans, and disputes
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className={styles.tabs}
      >
        {/* Replace TabsList with dropdown */}
        <div className="flex items-center justify-between mb-6">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-[180px] justify-between">
                {getTabLabel(activeTab)}
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => setActiveTab("overview")}>
                Overview
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveTab("active")}>
                Active Bans
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveTab("recent")}>
                Recent Actions
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveTab("disputes")}>
                Disputes
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Add a refresh button */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => fetchData()}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </Button>
        </div>

        <TabsContent className={styles.tabsContent} value="overview">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">
                  Active Warnings
                </CardTitle>
                <AlertTriangle className="w-4 h-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.warnings}</div>
                <p
                  className={cn(
                    "text-xs",
                    stats.warnings > 0
                      ? "text-green-500"
                      : "text-muted-foreground"
                  )}
                >
                  {stats.warnings}% from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">
                  Active Bans
                </CardTitle>
                <Ban className="w-4 h-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeBans}</div>
                <p
                  className={cn(
                    "text-xs",
                    stats.activeBans > 0
                      ? "text-red-500"
                      : "text-muted-foreground"
                  )}
                >
                  {stats.activeBans}% from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">
                  Total Actions
                </CardTitle>
                <Activity className="w-4 h-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalActions}</div>
                <p
                  className={cn(
                    "text-xs",
                    stats.totalActions > 0
                      ? "text-green-500"
                      : "text-muted-foreground"
                  )}
                >
                  {stats.totalActions}% from last month
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="md:col-span-4">
              <CardHeader>
                <CardTitle>Recent Actions</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center h-48">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentActions.slice(0, 5).map((action) => (
                      <div
                        key={action._id}
                        className="flex items-center justify-between pb-2 border-b last:border-0 last:pb-0"
                      >
                        <div className="flex items-center gap-2">
                          {action.action === "warn" ? (
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                          ) : action.action === "ban" ? (
                            <Badge
                              variant={
                                isPlayerUnbanned(action.playerId, action)
                                  ? "outline"
                                  : "destructive"
                              }
                            >
                              {isPlayerUnbanned(action.playerId, action)
                                ? "Unbanned"
                                : "Ban"}
                            </Badge>
                          ) : (
                            <Check className="w-4 h-4 text-green-500" />
                          )}
                          <div>
                            <p className="text-sm font-medium">
                              {action.playerName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {action.action === "warn"
                                ? "Warning"
                                : action.action === "ban"
                                ? `Ban (${action.duration || "Permanent"})`
                                : "Unban"}
                            </p>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatTimeAgo(new Date(action.timestamp))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setActiveTab("recent")}
                >
                  View All
                </Button>
              </CardFooter>
            </Card>
            <Card className="md:col-span-3">
              <CardHeader>
                <CardTitle>Pending Disputes</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center h-48">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  </div>
                ) : disputes.length > 0 ? (
                  <div className="space-y-4">
                    {disputes.slice(0, 3).map((dispute) => (
                      <div
                        key={dispute._id}
                        className="flex items-center justify-between pb-2 border-b last:border-0 last:pb-0"
                      >
                        <div>
                          <p className="text-sm font-medium">
                            {dispute.playerName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Disputing{" "}
                            {dispute.moderationAction.type === "warning"
                              ? "Warning"
                              : "Ban"}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDispute(dispute)}
                        >
                          Review
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-48 text-center">
                    <Shield className="w-8 h-8 mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No pending disputes</p>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setActiveTab("disputes")}
                >
                  View All
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        <TabsContent className={styles.tabsContent} value="active">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Active Bans</h2>
                <div className="relative w-full max-w-sm">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search active bans..."
                    className="pl-8"
                  />
                </div>
              </div>

              {/* Desktop view (hidden on small screens) */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Player</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Moderator</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeActions.length > 0 ? (
                      activeActions.map((action) => (
                        <TableRow key={action._id}>
                          <TableCell className="font-medium">
                            {action.playerName}
                          </TableCell>
                          <TableCell>{action.reason}</TableCell>
                          <TableCell>
                            {action.duration || "Permanent"}
                          </TableCell>
                          <TableCell>{action.moderatorName}</TableCell>
                          <TableCell>
                            {new Date(action.timestamp).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleUnban(action.playerId, action.playerName)
                              }
                              disabled={isPlayerUnbanned(
                                action.playerId,
                                action
                              )}
                            >
                              <Check className="w-4 h-4 mr-1" />
                              Unban
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                          No active bans found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile/tablet view (shown only on small screens) */}
              <div className="space-y-4 md:hidden">
                {activeActions.length > 0 ? (
                  activeActions.map((action) => (
                    <Card key={action._id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-medium">{action.playerName}</h3>
                            <p className="text-sm text-muted-foreground">
                              {formatTimeAgo(new Date(action.timestamp))}
                            </p>
                          </div>
                          <Badge
                            variant={
                              isPlayerUnbanned(action.playerId, action)
                                ? "outline"
                                : "destructive"
                            }
                          >
                            {isPlayerUnbanned(action.playerId, action)
                              ? "Unbanned"
                              : "Ban"}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-2 my-2 text-sm">
                          <div>
                            <p className="font-medium text-muted-foreground">
                              Reason:
                            </p>
                            <p className="line-clamp-2">{action.reason}</p>
                          </div>
                          <div>
                            <p className="font-medium text-muted-foreground">
                              Moderator:
                            </p>
                            <p>{action.moderatorName}</p>
                          </div>
                          {action.duration && (
                            <div>
                              <p className="font-medium text-muted-foreground">
                                Duration:
                              </p>
                              <p>{action.duration}</p>
                            </div>
                          )}
                        </div>

                        <div className="flex justify-end mt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleUnban(action.playerId, action.playerName)
                            }
                            disabled={isPlayerUnbanned(action.playerId, action)}
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Unban
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-24 text-center">
                    <p className="text-muted-foreground">
                      No active bans found
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent className={styles.tabsContent} value="recent">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="relative grow">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search actions..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select
                  value={filter}
                  onValueChange={(value) => setFilter(value as FilterType)}
                >
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <div className="flex items-center">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Filter" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    <SelectItem value="warnings">Warnings</SelectItem>
                    <SelectItem value="bans">Bans</SelectItem>
                    <SelectItem value="active">Active Bans</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="hidden border rounded-md md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Player</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Moderator</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getFilteredActions(recentActions).map((action) => (
                      <TableRow key={action._id}>
                        <TableCell>
                          <Badge
                            variant={
                              isPlayerUnbanned(action.playerId, action)
                                ? "outline"
                                : "destructive"
                            }
                          >
                            {isPlayerUnbanned(action.playerId, action)
                              ? "Unbanned"
                              : "Ban"}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {action.playerName}
                        </TableCell>
                        <TableCell>{action.reason}</TableCell>
                        <TableCell>{action.moderatorName}</TableCell>
                        <TableCell>
                          {new Date(action.timestamp).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <ChevronDown className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <History className="w-4 h-4 mr-2" />
                                View Player History
                              </DropdownMenuItem>
                              {action.action === "ban" && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleUnban(
                                      action.playerId,
                                      action.playerName
                                    )
                                  }
                                  disabled={isPlayerUnbanned(
                                    action.playerId,
                                    action
                                  )}
                                >
                                  <Check className="w-4 h-4 mr-2" />
                                  Unban Player
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                    {getFilteredActions(recentActions).length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="h-24 text-center text-muted-foreground"
                        >
                          No actions found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile view for recent actions */}
              <div className="space-y-4 md:hidden">
                {getFilteredActions(recentActions).map((action) => (
                  <Card key={action._id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium">{action.playerName}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(action.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge
                          variant={
                            isPlayerUnbanned(action.playerId, action)
                              ? "outline"
                              : "destructive"
                          }
                        >
                          {isPlayerUnbanned(action.playerId, action)
                            ? "Unbanned"
                            : "Ban"}
                        </Badge>
                      </div>
                      <p className="mb-2 text-sm">{action.reason}</p>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                          By {action.moderatorName}
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-8 h-8 p-0"
                          >
                            <History className="w-4 h-4" />
                          </Button>
                          {action.action === "ban" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-8 h-8 p-0"
                              onClick={() =>
                                handleUnban(action.playerId, action.playerName)
                              }
                              disabled={isPlayerUnbanned(
                                action.playerId,
                                action
                              )}
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {getFilteredActions(recentActions).length === 0 && (
                  <div className="py-8 text-center text-muted-foreground">
                    No actions found
                  </div>
                )}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent className={styles.tabsContent} value="disputes">
          <div className="grid gap-4">
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : disputes.length > 0 ? (
              disputes.map((dispute) => (
                <Card key={dispute._id}>
                  <CardContent className="pt-6">
                    <div className="flex flex-col gap-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{dispute.playerName}</p>
                          <div className="text-sm text-muted-foreground">
                            Submitted{" "}
                            {formatTimeAgo(new Date(dispute.createdAt))}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDispute(dispute)}
                        >
                          Review
                        </Button>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Dispute Reason:</p>
                        <p className="text-sm">{dispute.reason}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Original Action:</p>
                        <p className="text-sm">
                          {dispute.moderationAction.type === "warning"
                            ? "Warning"
                            : "Ban"}{" "}
                          by {dispute.moderationAction.moderatorName}
                        </p>
                        <p className="text-sm">
                          {dispute.moderationAction.reason}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-center">
                <Shield className="w-12 h-12 mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No pending disputes</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {selectedDispute && (
        <DisputeReviewDialog
          dispute={selectedDispute}
          open={disputeDialogOpen}
          onOpenChange={setDisputeDialogOpen}
          onDisputeResolved={handleDisputeResolved}
        />
      )}
    </div>
  );
}
