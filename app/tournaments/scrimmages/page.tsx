"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { FeatureGate } from "@/components/feature-gate";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import {
  Calendar,
  Clock,
  MapPin,
  Loader2,
  Trophy,
  Search,
  Copy,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { PendingScrimmageCard } from "@/components/scrimmages/pending-scrimmage-card";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { SECURITY_CONFIG } from "@/lib/security-config";
import { ScrimmageCardSkeleton } from "@/components/loading-skeleton";

interface MapSelection {
  id: string;
  name: string;
  isSmallVariant: boolean;
  image?: string;
}

interface Queue {
  _id: string;
  name: string;
  isSmallVariant: boolean;
  image?: string;
}

interface Scrimmage {
  _id: string;
  challengerTeam: {
    _id: string;
    name: string;
    tag: string;
  };
  challengedTeam: {
    _id: string;
    name: string;
    tag: string;
  };
  challengerCaptain: {
    discordId: string;
    discordUsername: string;
    discordNickname: string;
    discordProfilePicture: string;
  };
  proposedDate: string;
  selectedMaps: MapSelection[];
  mapDetails?: any[];
  message?: string;
  status: "pending" | "accepted" | "rejected" | "completed" | "cancelled";
  createdAt: string;
  scrimmageId?: string;
  winner?: string;
  teamSize?: number;
}

export default function ScrimmagesPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState("pending");
  const [scrimmages, setScrimmages] = useState<Scrimmage[]>([]);
  const [loading, setLoading] = useState(true);
  const [userTeam, setUserTeam] = useState<any>(null);
  const [teamFilter, setTeamFilter] = useState("");
  const [filteredPendingScrimmages, setFilteredPendingScrimmages] = useState<
    Scrimmage[]
  >([]);
  const [filteredUpcomingScrimmages, setFilteredUpcomingScrimmages] = useState<
    Scrimmage[]
  >([]);
  const [filteredCompletedScrimmages, setFilteredCompletedScrimmages] =
    useState<Scrimmage[]>([]);
  const [scrimmageToDelete, setScrimmageToDelete] = useState<string | null>(
    null
  );

  // Wrap fetchScrimmages in useCallback
  const fetchScrimmages = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/scrimmages");
      if (!response.ok) {
        throw new Error("Failed to fetch scrimmages");
      }
      const data = await response.json();
      
      // Handle both old format (array) and new format (object with scrimmages and userTeam)
      if (Array.isArray(data)) {
        setScrimmages(data);
      } else {
        setScrimmages(data.scrimmages || []);
        // Update user team if provided (avoids separate API call)
        if (data.userTeam !== undefined) {
          setUserTeam(data.userTeam);
        }
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error fetching scrimmages:", error);
      }
      toast({
        title: "Error",
        description: "Failed to fetch scrimmages",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependency array means this function won't change

  // Only fetch user team separately if we don't have it from scrimmages API
  const fetchUserTeam = useCallback(async () => {
    if (session?.user?.id && !userTeam) {
      try {
        const response = await fetch("/api/teams/user-team");
        if (response.ok) {
          const data = await response.json();
          setUserTeam(data.team);
        }
      } catch (error) {
        console.error("Error fetching user team:", error);
      }
    }
  }, [session?.user?.id, userTeam]); // Only recreate if session.user.id or userTeam changes

  useEffect(() => {
    // Fetch scrimmages (which now also returns user team if available)
    fetchScrimmages();
  }, [fetchScrimmages]);

  // Fallback: Only fetch user team separately if we still don't have it after scrimmages fetch
  useEffect(() => {
    if (session?.user?.id && !userTeam) {
      // Small delay to allow scrimmages fetch to complete first
      const timer = setTimeout(() => {
        fetchUserTeam();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [session?.user?.id, userTeam, fetchUserTeam]);

  useEffect(() => {
    const filterByTeam = (scrimmages: Scrimmage[]) => {
      if (!teamFilter) return scrimmages;

      return scrimmages.filter(
        (s) =>
          s.challengerTeam?.name
            .toLowerCase()
            .includes(teamFilter.toLowerCase()) ||
          s.challengerTeam?.tag
            .toLowerCase()
            .includes(teamFilter.toLowerCase()) ||
          s.challengedTeam?.name
            .toLowerCase()
            .includes(teamFilter.toLowerCase()) ||
          s.challengedTeam?.tag.toLowerCase().includes(teamFilter.toLowerCase())
      );
    };

    setFilteredPendingScrimmages(
      filterByTeam(scrimmages.filter((s) => s.status === "pending"))
    );
    setFilteredUpcomingScrimmages(
      filterByTeam(scrimmages.filter((s) => s.status === "accepted"))
    );
    setFilteredCompletedScrimmages(
      filterByTeam(scrimmages.filter((s) => s.status === "completed"))
    );
  }, [teamFilter, scrimmages]);

  // Filter scrimmages based on status
  const pendingScrimmages = scrimmages.filter(
    (scrimmage) => scrimmage.status === "pending"
  );
  const upcomingScrimmages = scrimmages.filter(
    (scrimmage) => scrimmage.status === "accepted"
  );
  const completedScrimmages = scrimmages.filter(
    (scrimmage) => scrimmage.status === "completed"
  );

  // Check if user is a team captain
  const isTeamCaptain = userTeam?.captain?.discordId === session?.user?.id;

  // Handle accepting a challenge
  const handleAcceptChallenge = async (scrimmageId: string) => {
    try {
      const response = await fetch(`/api/scrimmages/${scrimmageId}/accept`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to accept challenge");
      }

      // Refresh scrimmages with proper typing
      setScrimmages((prev) =>
        prev.map((s) =>
          s._id === scrimmageId ? { ...s, status: "accepted" as const } : s
        )
      );

      toast({
        title: "Challenge Accepted",
        description: "You have accepted the scrimmage challenge.",
      });
    } catch (error) {
      console.error("Error accepting challenge:", error);
      toast({
        title: "Error",
        description: "Failed to accept the challenge. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle rejecting a challenge
  const handleRejectChallenge = async (scrimmageId: string) => {
    try {
      const response = await fetch(`/api/scrimmages/${scrimmageId}/reject`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to reject challenge");
      }

      // Refresh scrimmages with proper typing
      setScrimmages((prev) =>
        prev.map((s) =>
          s._id === scrimmageId ? { ...s, status: "rejected" as const } : s
        )
      );

      toast({
        title: "Challenge Rejected",
        description: "You have rejected the scrimmage challenge.",
      });
    } catch (error) {
      console.error("Error rejecting challenge:", error);
      toast({
        title: "Error",
        description: "Failed to reject the challenge. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCancelChallenge = async (scrimmageId: string) => {
    try {
      const response = await fetch(`/api/scrimmages/${scrimmageId}/cancel`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to cancel challenge");
      }

      // Remove the scrimmage from the list
      setScrimmages(scrimmages.filter((s) => s._id !== scrimmageId));

      toast({
        title: "Challenge Canceled",
        description: "You have canceled the scrimmage challenge.",
      });
    } catch (error) {
      console.error("Error canceling challenge:", error);
      toast({
        title: "Error",
        description: "Failed to cancel the challenge. Please try again.",
        variant: "destructive",
      });
    }
  };

  function filterBadWords(message: string): string {
    if (!message) return "";

    const badWords = [
      "fuck",
      "shit",
      "ass",
      "bitch",
      "cunt",
      "dick",
      "pussy",
      "cock",
      "nigger",
      "faggot",
    ];

    let filteredMessage = message;
    badWords.forEach((word) => {
      const regex = new RegExp(`\\b${word}\\b`, "gi");
      filteredMessage = filteredMessage.replace(regex, "*".repeat(word.length));
    });

    return filteredMessage;
  }

  const CompletedScrimmages = ({ scrimmages }: { scrimmages: any[] }) => {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {scrimmages.map((scrimmage) => {
          // Determine the winner correctly
          let winnerTeam;

          // Check different possible formats for the winner field
          if (
            scrimmage.winner === "teamA" ||
            scrimmage.winner === "challenger" ||
            scrimmage.winner === scrimmage.challengerTeam?._id
          ) {
            winnerTeam = scrimmage.challengerTeam;
          } else if (
            scrimmage.winner === "teamB" ||
            scrimmage.winner === "challenged" ||
            scrimmage.winner === scrimmage.challengedTeam?._id
          ) {
            winnerTeam = scrimmage.challengedTeam;
          } else {
            // If winner is stored as the team name
            if (scrimmage.winner === scrimmage.challengerTeam?.name) {
              winnerTeam = scrimmage.challengerTeam;
            } else if (scrimmage.winner === scrimmage.challengedTeam?.name) {
              winnerTeam = scrimmage.challengedTeam;
            } else {
              // Default case - check map scores if available
              const mapScores = scrimmage.mapDetails || [];
              let challengerWins = 0;
              let challengedWins = 0;

              mapScores.forEach((map: any) => {
                if (map.teamAScore > map.teamBScore) {
                  challengerWins++;
                } else if (map.teamBScore > map.teamAScore) {
                  challengedWins++;
                }
              });

              if (challengerWins > challengedWins) {
                winnerTeam = scrimmage.challengerTeam;
              } else if (challengedWins > challengerWins) {
                winnerTeam = scrimmage.challengedTeam;
              } else {
                // If still can't determine, just show the first team
                winnerTeam = scrimmage.challengerTeam;
              }
            }
          }

          const isChallengerWinner = winnerTeam?._id === scrimmage.challengerTeam?._id;

          return (
            <ContextMenu key={scrimmage._id}>
              <ContextMenuTrigger>
                <Card className="overflow-hidden border-2 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/30 transition-all">
                  <CardHeader className="p-3 sm:p-4 pb-2 sm:pb-3 bg-gradient-to-br from-green-500/10 to-green-500/5 border-b">
                    <div className="flex flex-col gap-2">
                      {/* Status badge - top right on small screens, normal position on larger screens */}
                      <div className="flex justify-end sm:hidden">
                        <Badge className="bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/50 shrink-0">
                          Completed
                        </Badge>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base sm:text-lg font-bold mb-1.5 sm:mb-2 break-words">
                            <span className="block sm:inline">{scrimmage.challengerTeam?.name || "Team A"}</span>
                            <span className="mx-1.5 sm:mx-2 text-muted-foreground">vs</span>
                            <span className="block sm:inline">{scrimmage.challengedTeam?.name || "Team B"}</span>
                          </CardTitle>
                          <div className="flex flex-wrap gap-1.5 sm:gap-2 items-center mt-1.5">
                            {scrimmage.teamSize && (
                              <Badge variant="secondary" className="text-xs">
                                {scrimmage.teamSize === 2
                                  ? "2v2"
                                  : scrimmage.teamSize === 3
                                  ? "3v3"
                                  : scrimmage.teamSize === 4
                                  ? "4v4"
                                  : scrimmage.teamSize === 5
                                  ? "5v5"
                                  : `${scrimmage.teamSize}v${scrimmage.teamSize}`}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Badge className="hidden sm:flex bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/50 shrink-0">
                          Completed
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4 pt-2 sm:pt-3 pb-2 sm:pb-3">
                    <div className="space-y-2 sm:space-y-3">
                      <div className="flex items-center gap-2 text-xs sm:text-sm">
                        <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground shrink-0" />
                        <span className="text-muted-foreground break-words">
                          {format(
                            new Date(scrimmage.proposedDate),
                            "MMMM d, yyyy"
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs sm:text-sm">
                        <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-500 shrink-0" />
                        <div className="flex-1 min-w-0 flex flex-wrap items-center gap-1.5">
                          <span className="font-medium text-foreground break-words">
                            {winnerTeam?.name || "Unknown team"} won
                          </span>
                          {winnerTeam?.tag && (
                            <Badge variant="outline" className="text-xs">
                              [{winnerTeam.tag}]
                            </Badge>
                          )}
                        </div>
                      </div>
                      {scrimmage.selectedMaps && scrimmage.selectedMaps.length > 0 && (
                        <div className="flex items-start gap-2 text-xs sm:text-sm pt-1">
                          <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium mb-1 sm:mb-1.5 text-foreground">Maps</p>
                            <div className="flex flex-wrap gap-1 sm:gap-1.5">
                              {scrimmage.selectedMaps.slice(0, 3).map((map: any, idx: number) => (
                                <Badge
                                  key={map.id || idx}
                                  variant="secondary"
                                  className="text-xs font-normal break-words max-w-full"
                                >
                                  <span className="line-clamp-1">{map.name}</span>
                                </Badge>
                              ))}
                              {scrimmage.selectedMaps.length > 3 && (
                                <Badge variant="secondary" className="text-xs font-normal">
                                  +{scrimmage.selectedMaps.length - 3} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end p-3 sm:p-4 pt-2 sm:pt-3">
                    <Button variant="outline" size="sm" className="w-full sm:w-auto" asChild>
                      <Link
                        href={`/tournaments/scrimmages/${
                          scrimmage.scrimmageId || scrimmage._id
                        }`}
                      >
                        View Match
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              </ContextMenuTrigger>
              {canManageScrimmages() && (
                <ContextMenuContent className="w-64">
                  <ContextMenuItem
                    onClick={() =>
                      copyToClipboard(
                        scrimmage._id,
                        "Scrimmage ID copied to clipboard"
                      )
                    }
                  >
                    <Copy className="mr-2 w-4 h-4" />
                    Copy Scrimmage ID
                  </ContextMenuItem>
                  <ContextMenuItem
                    onClick={() =>
                      copyToClipboard(
                        `${window.location.origin}/tournaments/scrimmages/${scrimmage._id}`,
                        "Scrimmage URL copied to clipboard"
                      )
                    }
                  >
                    <ExternalLink className="mr-2 w-4 h-4" />
                    Copy Scrimmage URL
                  </ContextMenuItem>
                  <ContextMenuItem
                    className="text-red-600"
                    onClick={() => setScrimmageToDelete(scrimmage._id)}
                  >
                    <Trash2 className="mr-2 w-4 h-4" />
                    Delete Scrimmage
                  </ContextMenuItem>
                </ContextMenuContent>
              )}
            </ContextMenu>
          );
        })}
      </div>
    );
  };

  const canManageScrimmages = () => {
    return (
      session?.user?.roles?.includes("admin") ||
      session?.user?.id === SECURITY_CONFIG.DEVELOPER_ID
    );
  };

  const copyToClipboard = (text: string, description: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: description,
    });
  };

  const handleDeleteScrimmage = async () => {
    if (!scrimmageToDelete) return;

    try {
      const response = await fetch(`/api/scrimmages/${scrimmageToDelete}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete scrimmage");
      }

      toast({
        title: "Scrimmage deleted",
        description: "The scrimmage has been successfully deleted",
      });

      // Refresh the scrimmages list
      fetchScrimmages();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete scrimmage",
        variant: "destructive",
      });
    } finally {
      setScrimmageToDelete(null);
    }
  };

  return (
    <FeatureGate feature="scrimmage">
      <div className="min-h-screen bg-background">
        <main className="px-4 py-6 mx-auto max-w-screen-xl sm:px-6 lg:px-8 xl:px-12 sm:py-8 lg:py-10">
          {/* Header Section */}
          <div className="mb-6 sm:mb-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="relative p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 border-2 border-primary/30 shadow-lg shadow-primary/10 shrink-0">
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/40 to-transparent opacity-50" />
                <Trophy className="relative w-6 h-6 sm:w-7 sm:h-7 text-primary drop-shadow-sm" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-foreground to-foreground/80">
                  Scrimmages
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground mt-1">
                  Manage and view competitive team scrimmages
                </p>
              </div>
            </div>
          </div>

          <Card className="border-2">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Filter by team name or tag..."
                    className="pl-9 h-10 border-2"
                    value={teamFilter}
                    onChange={(e) => setTeamFilter(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="px-4 sm:px-6">
                  <TabsList className="grid w-full grid-cols-3 bg-muted/50">
                    <TabsTrigger
                      value="pending"
                      className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                      Pending
                      {filteredPendingScrimmages.length > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          {filteredPendingScrimmages.length}
                        </Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger
                      value="upcoming"
                      className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                      Upcoming
                      {filteredUpcomingScrimmages.length > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          {filteredUpcomingScrimmages.length}
                        </Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger
                      value="completed"
                      className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                      Completed
                      {filteredCompletedScrimmages.length > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          {filteredCompletedScrimmages.length}
                        </Badge>
                      )}
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="pending" className="mt-6 px-4 sm:px-6 pb-6">
                  {loading ? (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {[1, 2, 3].map((i) => (
                        <ScrimmageCardSkeleton key={i} />
                      ))}
                    </div>
                  ) : !session?.user ? (
                    <Card className="border-2">
                      <CardContent className="p-12 text-center">
                        <div className="relative p-4 rounded-full bg-muted mb-4 inline-block">
                          <Trophy className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">
                          Sign in to view pending scrimmages
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          You need to be signed in to view and manage pending scrimmages.
                        </p>
                        <Button asChild>
                          <Link href="/api/auth/signin">Sign In</Link>
                        </Button>
                      </CardContent>
                    </Card>
                  ) : pendingScrimmages.length === 0 ? (
                    <Card className="border-2">
                      <CardContent className="p-12 text-center">
                        <div className="relative p-4 rounded-full bg-muted mb-4 inline-block">
                          <Trophy className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">
                          No pending challenges
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Challenge a team to start a scrimmage.
                        </p>
                      </CardContent>
                    </Card>
                  ) : filteredPendingScrimmages.length === 0 ? (
                    <Card className="border-2">
                      <CardContent className="p-12 text-center">
                        <div className="relative p-4 rounded-full bg-muted mb-4 inline-block">
                          <Search className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">No matches found</h3>
                        <p className="text-sm text-muted-foreground">
                          Try adjusting your team filter.
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {filteredPendingScrimmages.map((scrimmage) => (
                        <PendingScrimmageCard
                          key={scrimmage._id}
                          scrimmage={scrimmage}
                          isTeamCaptain={isTeamCaptain}
                          userTeam={userTeam}
                          onAccept={handleAcceptChallenge}
                          onReject={handleRejectChallenge}
                          onCancel={handleCancelChallenge}
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="upcoming" className="mt-6 px-4 sm:px-6 pb-6">
                  {loading ? (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {[1, 2, 3].map((i) => (
                        <ScrimmageCardSkeleton key={i} />
                      ))}
                    </div>
                  ) : upcomingScrimmages.length === 0 ? (
                    <Card className="border-2">
                      <CardContent className="p-12 text-center">
                        <div className="relative p-4 rounded-full bg-muted mb-4 inline-block">
                          <Calendar className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">
                          No upcoming scrimmages
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          There are no upcoming scrimmages scheduled.
                        </p>
                      </CardContent>
                    </Card>
                  ) : filteredUpcomingScrimmages.length === 0 ? (
                    <Card className="border-2">
                      <CardContent className="p-12 text-center">
                        <div className="relative p-4 rounded-full bg-muted mb-4 inline-block">
                          <Search className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">No matches found</h3>
                        <p className="text-sm text-muted-foreground">
                          Try adjusting your team filter.
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {filteredUpcomingScrimmages.map((scrimmage) => (
                        <ContextMenu key={scrimmage._id}>
                          <ContextMenuTrigger>
                            <Card className="overflow-hidden border-2 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/30 transition-all">
                              <CardHeader className="p-3 sm:p-4 pb-2 sm:pb-3 bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-b">
                                <div className="flex flex-col gap-2">
                                  {/* Status badge - top right on small screens, normal position on larger screens */}
                                  <div className="flex justify-end sm:hidden">
                                    <Badge className="bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/50 shrink-0">
                                      Upcoming
                                    </Badge>
                                  </div>
                                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                                    <div className="flex-1 min-w-0">
                                      <CardTitle className="text-base sm:text-lg font-bold mb-1.5 sm:mb-2 break-words">
                                        <span className="block sm:inline">{scrimmage.challengerTeam?.name || "Team A"}</span>
                                        <span className="mx-1.5 sm:mx-2 text-muted-foreground">vs</span>
                                        <span className="block sm:inline">{scrimmage.challengedTeam?.name || "Team B"}</span>
                                      </CardTitle>
                                      <div className="flex flex-wrap gap-1.5 sm:gap-2 items-center mt-1.5">
                                        {scrimmage.teamSize && (
                                          <Badge variant="secondary" className="text-xs">
                                            {scrimmage.teamSize === 2
                                              ? "2v2"
                                              : scrimmage.teamSize === 3
                                              ? "3v3"
                                              : scrimmage.teamSize === 4
                                              ? "4v4"
                                              : scrimmage.teamSize === 5
                                              ? "5v5"
                                              : `${scrimmage.teamSize}v${scrimmage.teamSize}`}
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                    <Badge className="hidden sm:flex bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/50 shrink-0">
                                      Upcoming
                                    </Badge>
                                  </div>
                                </div>
                              </CardHeader>
                              <CardContent className="p-3 sm:p-4 pt-2 sm:pt-3 pb-2 sm:pb-3">
                                <div className="space-y-2 sm:space-y-3">
                                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                                    <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground shrink-0" />
                                    <span className="text-muted-foreground break-words">
                                      {format(
                                        new Date(scrimmage.proposedDate),
                                        "MMMM d, yyyy"
                                      )}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                                    <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground shrink-0" />
                                    <span className="text-muted-foreground">
                                      {format(
                                        new Date(scrimmage.proposedDate),
                                        "h:mm a"
                                      )}
                                    </span>
                                  </div>
                                  {scrimmage.selectedMaps && scrimmage.selectedMaps.length > 0 && (
                                    <div className="flex items-start gap-2 text-xs sm:text-sm pt-1">
                                      <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground shrink-0 mt-0.5" />
                                      <div className="flex-1 min-w-0">
                                        <p className="font-medium mb-1 sm:mb-1.5 text-foreground">Maps</p>
                                        <div className="flex flex-wrap gap-1 sm:gap-1.5">
                                          {scrimmage.selectedMaps.slice(0, 3).map((map: any, idx: number) => (
                                            <Badge
                                              key={map.id || idx}
                                              variant="secondary"
                                              className="text-xs font-normal break-words max-w-full"
                                            >
                                              <span className="line-clamp-1">{map.name}</span>
                                            </Badge>
                                          ))}
                                          {scrimmage.selectedMaps.length > 3 && (
                                            <Badge variant="secondary" className="text-xs font-normal">
                                              +{scrimmage.selectedMaps.length - 3} more
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                              <CardFooter className="flex justify-end p-3 sm:p-4 pt-2 sm:pt-3">
                                <Button variant="outline" size="sm" className="w-full sm:w-auto" asChild>
                                  <Link
                                    href={`/tournaments/scrimmages/${
                                      scrimmage.scrimmageId || scrimmage._id
                                    }`}
                                  >
                                    View Match
                                  </Link>
                                </Button>
                              </CardFooter>
                            </Card>
                          </ContextMenuTrigger>
                          {canManageScrimmages() && (
                            <ContextMenuContent className="w-64">
                              <ContextMenuItem
                                onClick={() =>
                                  copyToClipboard(
                                    scrimmage._id,
                                    "Scrimmage ID copied to clipboard"
                                  )
                                }
                              >
                                <Copy className="mr-2 w-4 h-4" />
                                Copy Scrimmage ID
                              </ContextMenuItem>
                              <ContextMenuItem
                                onClick={() =>
                                  copyToClipboard(
                                    `${window.location.origin}/tournaments/scrimmages/${scrimmage._id}`,
                                    "Scrimmage URL copied to clipboard"
                                  )
                                }
                              >
                                <ExternalLink className="mr-2 w-4 h-4" />
                                Copy Scrimmage URL
                              </ContextMenuItem>
                              <ContextMenuItem
                                className="text-red-600"
                                onClick={() =>
                                  setScrimmageToDelete(scrimmage._id)
                                }
                              >
                                <Trash2 className="mr-2 w-4 h-4" />
                                Delete Scrimmage
                              </ContextMenuItem>
                            </ContextMenuContent>
                          )}
                        </ContextMenu>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="completed" className="mt-6 px-4 sm:px-6 pb-6">
                  {loading ? (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {[1, 2, 3].map((i) => (
                        <ScrimmageCardSkeleton key={i} />
                      ))}
                    </div>
                  ) : completedScrimmages.length === 0 ? (
                    <Card className="border-2">
                      <CardContent className="p-12 text-center">
                        <div className="relative p-4 rounded-full bg-muted mb-4 inline-block">
                          <Trophy className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">
                          No completed scrimmages
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          There are no completed scrimmages yet.
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <CompletedScrimmages
                      scrimmages={filteredCompletedScrimmages}
                    />
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </main>

        {/* Confirmation Dialog */}
        <AlertDialog
          open={!!scrimmageToDelete}
          onOpenChange={(open) => !open && setScrimmageToDelete(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Scrimmage</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this scrimmage? This action
                cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteScrimmage}
                className="text-white bg-red-600 hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </FeatureGate>
  );
}
