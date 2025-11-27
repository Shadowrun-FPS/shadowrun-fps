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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";

interface ModerationLog {
  _id: string;
  action: string;
  playerId: string;
  playerName: string;
  playerNickname?: string;
  playerProfilePicture?: string | null;
  playerDiscordId?: string;
  moderatorId: string;
  moderatorName: string;
  moderatorNickname?: string;
  moderatorProfilePicture?: string | null;
  moderatorDiscordId?: string;
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
  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Use the correct API endpoint path
      const response = await fetch("/api/admin/moderation-logs");

      if (!response.ok) {
        throw new Error("Failed to fetch moderation logs");
      }

      const data = await response.json();
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

  function handleViewHistory(action: ModerationLog): void {
    // Navigate to the player stats page
    router.push(`/admin/players/${action.playerId}/history`);
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 xl:px-12 py-6 sm:py-8 lg:py-10 space-y-4 sm:space-y-6 lg:space-y-8">
      <div className="flex flex-col space-y-2">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          Moderation Panel
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Manage player warnings, bans, and disputes
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        {/* Improved Tabs with better styling */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
          {/* Mobile: Dropdown, Desktop: TabsList */}
          <div className="hidden md:block">
            <TabsList className="grid w-full grid-cols-4 bg-muted/50 p-1 h-auto">
              <TabsTrigger
                value="overview"
                className="data-[state=active]:bg-background data-[state=active]:shadow-sm px-4 py-2 text-sm font-medium"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="active"
                className="data-[state=active]:bg-background data-[state=active]:shadow-sm px-4 py-2 text-sm font-medium"
              >
                Active Bans
              </TabsTrigger>
              <TabsTrigger
                value="recent"
                className="data-[state=active]:bg-background data-[state=active]:shadow-sm px-4 py-2 text-sm font-medium"
              >
                Recent Actions
              </TabsTrigger>
              <TabsTrigger
                value="disputes"
                className="data-[state=active]:bg-background data-[state=active]:shadow-sm px-4 py-2 text-sm font-medium"
              >
                Disputes
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Mobile: Dropdown Menu */}
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between min-h-[44px]">
                  {getTabLabel(activeTab)}
                  <ChevronDown className="ml-2 w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[200px]">
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
          </div>

          {/* Refresh button */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => fetchData()}
            disabled={loading}
            className="w-full sm:w-auto min-h-[44px] sm:min-h-0 sm:w-10 sm:h-10 hover:bg-accent transition-colors"
            title="Refresh data"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </Button>
        </div>

        <TabsContent value="overview" className="mt-0">
          <div className="space-y-6 sm:space-y-8">
            {/* Stats Cards */}
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              <Card className="relative overflow-hidden border-2 hover:border-amber-500/50 transition-all duration-300 hover:shadow-lg bg-gradient-to-br from-background to-muted/20">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <CardHeader className="flex flex-row justify-between items-center pb-2 space-y-0 px-4 sm:px-6 pt-4 sm:pt-6 relative z-10">
                  <CardTitle className="text-sm sm:text-base font-medium">
                    Active Warnings
                  </CardTitle>
                  <div className="p-2 rounded-lg bg-amber-500/10">
                    <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
                  </div>
                </CardHeader>
                <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 relative z-10">
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-amber-600 to-amber-400 bg-clip-text text-transparent">
                    {stats.warnings}
                  </div>
                  <p
                    className={cn(
                      "text-xs sm:text-sm mt-1",
                      stats.warnings > 0
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-muted-foreground"
                    )}
                  >
                    {stats.warnings} total warnings
                  </p>
                </CardContent>
              </Card>
              <Card className="relative overflow-hidden border-2 hover:border-red-500/50 transition-all duration-300 hover:shadow-lg bg-gradient-to-br from-background to-muted/20">
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <CardHeader className="flex flex-row justify-between items-center pb-2 space-y-0 px-4 sm:px-6 pt-4 sm:pt-6 relative z-10">
                  <CardTitle className="text-sm sm:text-base font-medium">
                    Active Bans
                  </CardTitle>
                  <div className="p-2 rounded-lg bg-red-500/10">
                    <Ban className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
                  </div>
                </CardHeader>
                <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 relative z-10">
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-red-600 to-red-400 bg-clip-text text-transparent">
                    {stats.activeBans}
                  </div>
                  <p
                    className={cn(
                      "text-xs sm:text-sm mt-1",
                      stats.activeBans > 0
                        ? "text-red-600 dark:text-red-400"
                        : "text-muted-foreground"
                    )}
                  >
                    {stats.activeBans} active bans
                  </p>
                </CardContent>
              </Card>
              <Card className="relative overflow-hidden border-2 hover:border-blue-500/50 transition-all duration-300 hover:shadow-lg bg-gradient-to-br from-background to-muted/20">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <CardHeader className="flex flex-row justify-between items-center pb-2 space-y-0 px-4 sm:px-6 pt-4 sm:pt-6 relative z-10">
                  <CardTitle className="text-sm sm:text-base font-medium">
                    Total Actions
                  </CardTitle>
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                  </div>
                </CardHeader>
                <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 relative z-10">
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                    {stats.totalActions}
                  </div>
                  <p
                    className={cn(
                      "text-xs sm:text-sm mt-1",
                      stats.totalActions > 0
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-muted-foreground"
                    )}
                  >
                    {stats.totalActions} total actions
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Actions and Pending Disputes */}
            <div className="grid gap-3 sm:gap-4 grid-cols-1 lg:grid-cols-7">
            <Card className="lg:col-span-4 border-2 bg-gradient-to-br from-background to-muted/20">
              <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6">
                <CardTitle className="text-base sm:text-lg font-semibold">Recent Actions</CardTitle>
              </CardHeader>
              <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                {loading ? (
                  <div className="flex justify-center items-center h-48">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentActions.slice(0, 5).map((action) => (
                      <div
                        key={action._id}
                        className="flex justify-between items-center pb-2 border-b last:border-0 last:pb-0"
                      >
                        <div className="flex gap-2 items-center">
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
              <CardFooter className="px-4 sm:px-6 pb-4 sm:pb-6">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full min-h-[44px] sm:min-h-0"
                  onClick={() => setActiveTab("recent")}
                >
                  View All
                </Button>
              </CardFooter>
            </Card>
            <Card className="lg:col-span-3 border-2 bg-gradient-to-br from-background to-muted/20">
              <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6">
                <CardTitle className="text-base sm:text-lg font-semibold">Pending Disputes</CardTitle>
              </CardHeader>
              <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                {loading ? (
                  <div className="flex justify-center items-center h-48">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  </div>
                ) : disputes.length > 0 ? (
                  <div className="space-y-4">
                    {disputes.slice(0, 3).map((dispute) => (
                      <div
                        key={dispute._id}
                        className="flex justify-between items-center pb-2 border-b last:border-0 last:pb-0"
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
                  <div className="flex flex-col justify-center items-center h-48 text-center">
                    <Shield className="mb-4 w-8 h-8 text-muted-foreground" />
                    <p className="text-muted-foreground">No pending disputes</p>
                  </div>
                )}
              </CardContent>
              <CardFooter className="px-4 sm:px-6 pb-4 sm:pb-6">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full min-h-[44px] sm:min-h-0"
                  onClick={() => setActiveTab("disputes")}
                >
                  View All
                </Button>
              </CardFooter>
            </Card>
          </div>
          </div>
        </TabsContent>

        <TabsContent value="active" className="mt-0">
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 sm:gap-4">
                <h2 className="text-lg sm:text-xl font-semibold">Active Bans</h2>
                <div className="relative w-full sm:max-w-sm">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search active bans..."
                    className="pl-8 min-h-[44px] sm:min-h-0"
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
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage
                                  src={action.playerProfilePicture || undefined}
                                  alt={action.playerName}
                                />
                                <AvatarFallback>
                                  {action.playerName?.charAt(0)?.toUpperCase() || "?"}
                                </AvatarFallback>
                              </Avatar>
                              <span>{action.playerName}</span>
                            </div>
                          </TableCell>
                          <TableCell>{action.reason}</TableCell>
                          <TableCell>
                            {action.duration || "Permanent"}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage
                                  src={action.moderatorProfilePicture || undefined}
                                  alt={action.moderatorName}
                                />
                                <AvatarFallback>
                                  {action.moderatorName?.charAt(0)?.toUpperCase() || "?"}
                                </AvatarFallback>
                              </Avatar>
                              <span>{action.moderatorName}</span>
                            </div>
                          </TableCell>
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
                              className="min-h-[44px] sm:min-h-0"
                            >
                              <Check className="mr-1 w-4 h-4" />
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
                    <Card key={action._id} className="border-2 hover:border-primary/50 transition-all duration-300 bg-gradient-to-br from-background to-muted/20">
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage
                                src={action.playerProfilePicture || undefined}
                                alt={action.playerName}
                              />
                              <AvatarFallback>
                                {action.playerName?.charAt(0)?.toUpperCase() || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-medium">{action.playerName}</h3>
                              <p className="text-sm text-muted-foreground">
                                {formatTimeAgo(new Date(action.timestamp))}
                              </p>
                            </div>
                          </div>
                          <Badge
                            variant={
                              action.action === "warn"
                                ? "warning"
                                : isPlayerUnbanned(action.playerId, action)
                                ? "outline"
                                : "destructive"
                            }
                          >
                            {action.action === "warn"
                              ? "Warning"
                              : isPlayerUnbanned(action.playerId, action)
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
                            <div className="flex items-center gap-2">
                              <Avatar className="h-5 w-5">
                                <AvatarImage
                                  src={action.moderatorProfilePicture || undefined}
                                  alt={action.moderatorName}
                                />
                                <AvatarFallback className="text-[10px]">
                                  {action.moderatorName?.charAt(0)?.toUpperCase() || "?"}
                                </AvatarFallback>
                              </Avatar>
                              <p>{action.moderatorName}</p>
                            </div>
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
                            className="min-h-[44px] sm:min-h-0"
                          >
                            <Check className="mr-1 w-4 h-4" />
                            Unban
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="flex flex-col justify-center items-center h-24 text-center">
                    <p className="text-muted-foreground">
                      No active bans found
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="recent" className="mt-0">
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search actions..."
                    className="pl-8 min-h-[44px] sm:min-h-0"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select
                  value={filter}
                  onValueChange={(value) => setFilter(value as FilterType)}
                >
                  <SelectTrigger className="w-full sm:w-[180px] min-h-[44px] sm:min-h-0">
                    <div className="flex items-center">
                      <Filter className="mr-2 w-4 h-4" />
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

              <div className="hidden rounded-md border md:block">
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
                          {action.action === "warn" ? (
                            <Badge variant="warning">Warning</Badge>
                          ) : (
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
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage
                                src={action.playerProfilePicture || undefined}
                                alt={action.playerName}
                              />
                              <AvatarFallback>
                                {action.playerName?.charAt(0)?.toUpperCase() || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <span>{action.playerName}</span>
                          </div>
                        </TableCell>
                        <TableCell>{action.reason}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage
                                src={action.moderatorProfilePicture || undefined}
                                alt={action.moderatorName}
                              />
                              <AvatarFallback>
                                {action.moderatorName?.charAt(0)?.toUpperCase() || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <span>{action.moderatorName}</span>
                          </div>
                        </TableCell>
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
                              <DropdownMenuItem
                                onClick={() => handleViewHistory(action)}
                              >
                                <History className="mr-2 w-4 h-4" />
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
                                  <Check className="mr-2 w-4 h-4" />
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
                  <Card key={action._id} className="border-2 hover:border-primary/50 transition-all duration-300 bg-gradient-to-br from-background to-muted/20">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src={action.playerProfilePicture || undefined}
                              alt={action.playerName}
                            />
                            <AvatarFallback>
                              {action.playerName?.charAt(0)?.toUpperCase() || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{action.playerName}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(action.timestamp).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant={
                            action.action === "warn"
                              ? "warning"
                              : isPlayerUnbanned(action.playerId, action)
                              ? "outline"
                              : "destructive"
                          }
                        >
                          {action.action === "warn"
                            ? "Warning"
                            : isPlayerUnbanned(action.playerId, action)
                            ? "Unbanned"
                            : "Ban"}
                        </Badge>
                      </div>
                      <p className="mb-2 text-sm">{action.reason}</p>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1.5">
                          <Avatar className="h-4 w-4">
                            <AvatarImage
                              src={action.moderatorProfilePicture || undefined}
                              alt={action.moderatorName}
                            />
                            <AvatarFallback className="text-[8px]">
                              {action.moderatorName?.charAt(0)?.toUpperCase() || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <p className="text-sm text-muted-foreground">
                            By {action.moderatorName}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-0 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 sm:w-8 sm:h-8 flex items-center justify-center"
                            onClick={() => handleViewHistory(action)}
                          >
                            <History className="w-4 h-4" />
                          </Button>
                          {action.action === "ban" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="p-0 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 sm:w-8 sm:h-8 flex items-center justify-center"
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

        <TabsContent value="disputes" className="mt-0">
          <div className="grid gap-4">
            {loading ? (
              <div className="flex justify-center items-center h-48">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : disputes.length > 0 ? (
              disputes.map((dispute) => (
                <Card key={dispute._id} className="border-2 hover:border-primary/50 transition-all duration-300 bg-gradient-to-br from-background to-muted/20">
                  <CardContent className="pt-6 px-4 sm:px-6 pb-4 sm:pb-6">
                    <div className="flex flex-col gap-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-base sm:text-lg">{dispute.playerName}</p>
                          <div className="text-sm text-muted-foreground">
                            Submitted{" "}
                            {formatTimeAgo(new Date(dispute.createdAt))}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDispute(dispute)}
                          className="min-h-[44px] sm:min-h-0"
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
              <div className="flex flex-col justify-center items-center h-48 text-center">
                <Shield className="mb-4 w-12 h-12 text-muted-foreground" />
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
