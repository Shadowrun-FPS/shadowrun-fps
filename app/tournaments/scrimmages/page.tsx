"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/ui/use-toast"; // keep this import
import { cn } from "@/lib/utils";
import { FeatureGate } from "@/components/feature-gate"; // This might be an unused import
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
      setScrimmages(data);
    } catch (error) {
      console.error("Error fetching scrimmages:", error);
      toast({
        title: "Error",
        description: "Failed to fetch scrimmages",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependency array means this function won't change

  // Wrap fetchUserTeam in useCallback
  const fetchUserTeam = useCallback(async () => {
    if (session?.user) {
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
  }, [session?.user]); // Only recreate if session.user changes

  useEffect(() => {
    // Fetch scrimmages for all users (including signed-out)
    fetchScrimmages();

    // Only fetch user team if logged in
    if (session?.user) {
      fetchUserTeam();
    }
  }, [session, fetchScrimmages, fetchUserTeam]);

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

          return (
            <ContextMenu key={scrimmage._id}>
              <ContextMenuTrigger>
                <Card className="overflow-hidden">
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        {scrimmage.challengerTeam?.name} vs{" "}
                        {scrimmage.challengedTeam?.name}
                      </CardTitle>
                      <Badge variant="secondary">Completed</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-2 pb-0">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span>
                          {format(
                            new Date(scrimmage.proposedDate),
                            "MMMM d, yyyy"
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Trophy className="w-4 h-4 text-yellow-500" />
                        <span className="font-medium">
                          {winnerTeam?.name || "Unknown team"} won
                        </span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end p-4">
                    <Button variant="outline" size="sm" asChild>
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
                    <Copy className="w-4 h-4 mr-2" />
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
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Copy Scrimmage URL
                  </ContextMenuItem>
                  <ContextMenuItem
                    className="text-red-600"
                    onClick={() => setScrimmageToDelete(scrimmage._id)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
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
      session?.user?.id === "238329746671271936"
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
    <div className="min-h-screen">
      <main className="container px-4 py-8 mx-auto">
        <h1 className="mb-6 text-2xl font-bold">Scrimmages</h1>

        <div className="space-y-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute w-4 h-4 -translate-y-1/2 left-3 top-1/2 text-muted-foreground" />
              <Input
                placeholder="Filter by team name or tag..."
                className="pl-9"
                value={teamFilter}
                onChange={(e) => setTeamFilter(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("pending")}
              className={cn(
                "px-4 py-2 rounded-md transition-colors",
                activeTab === "pending"
                  ? "bg-muted/50 font-medium"
                  : "text-muted-foreground hover:bg-muted/30"
              )}
            >
              Pending
            </button>
            <button
              onClick={() => setActiveTab("upcoming")}
              className={cn(
                "px-4 py-2 rounded-md transition-colors",
                activeTab === "upcoming"
                  ? "bg-muted/50 font-medium"
                  : "text-muted-foreground hover:bg-muted/30"
              )}
            >
              Upcoming
            </button>
            <button
              onClick={() => setActiveTab("completed")}
              className={cn(
                "px-4 py-2 rounded-md transition-colors",
                activeTab === "completed"
                  ? "bg-muted/50 font-medium"
                  : "text-muted-foreground hover:bg-muted/30"
              )}
            >
              Completed
            </button>
          </div>

          {/* Content based on active tab */}
          {activeTab === "pending" && (
            <div>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : !session?.user ? (
                <div className="p-12 text-center border rounded-lg">
                  <h3 className="text-lg font-medium">
                    Sign in to view pending scrimmages
                  </h3>
                  <p className="mt-2 text-muted-foreground">
                    You need to be signed in to view and manage pending
                    scrimmages.
                  </p>
                  <Button className="mt-4" asChild>
                    <Link href="/api/auth/signin">Sign In</Link>
                  </Button>
                </div>
              ) : pendingScrimmages.length === 0 ? (
                <div className="p-12 text-center border rounded-lg">
                  <h3 className="text-lg font-medium">No pending challenges</h3>
                  <p className="mt-2 text-muted-foreground">
                    Challenge a team to start a scrimmage.
                  </p>
                </div>
              ) : filteredPendingScrimmages.length === 0 ? (
                <div className="p-12 text-center border rounded-lg">
                  <h3 className="text-lg font-medium">No matches found</h3>
                  <p className="mt-2 text-muted-foreground">
                    Try adjusting your team filter.
                  </p>
                </div>
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
            </div>
          )}

          {activeTab === "upcoming" && (
            <div>
              {/* Upcoming scrimmages content */}
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : upcomingScrimmages.length === 0 ? (
                <div className="p-12 text-center border rounded-lg">
                  <h3 className="text-lg font-medium">
                    No upcoming scrimmages
                  </h3>
                  <p className="mt-2 text-muted-foreground">
                    There are no upcoming scrimmages scheduled.
                  </p>
                </div>
              ) : filteredUpcomingScrimmages.length === 0 ? (
                <div className="p-12 text-center border rounded-lg">
                  <h3 className="text-lg font-medium">No matches found</h3>
                  <p className="mt-2 text-muted-foreground">
                    Try adjusting your team filter.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredUpcomingScrimmages.map((scrimmage) => (
                    <ContextMenu key={scrimmage._id}>
                      <ContextMenuTrigger>
                        <Card className="overflow-hidden">
                          <CardHeader className="p-4 pb-2">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-lg">
                                {scrimmage.challengerTeam?.name} vs{" "}
                                {scrimmage.challengedTeam?.name}
                              </CardTitle>
                              <Badge variant="default">Upcoming</Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="p-4 pt-2 pb-0">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-sm">
                                <Calendar className="w-4 h-4 text-muted-foreground" />
                                <span>
                                  {format(
                                    new Date(scrimmage.proposedDate),
                                    "MMMM d, yyyy"
                                  )}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <Clock className="w-4 h-4 text-muted-foreground" />
                                <span>
                                  {format(
                                    new Date(scrimmage.proposedDate),
                                    "h:mm a"
                                  )}
                                </span>
                              </div>
                            </div>
                          </CardContent>
                          <CardFooter className="flex justify-end p-4">
                            <Button variant="outline" size="sm" asChild>
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
                            <Copy className="w-4 h-4 mr-2" />
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
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Copy Scrimmage URL
                          </ContextMenuItem>
                          <ContextMenuItem
                            className="text-red-600"
                            onClick={() => setScrimmageToDelete(scrimmage._id)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Scrimmage
                          </ContextMenuItem>
                        </ContextMenuContent>
                      )}
                    </ContextMenu>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "completed" && (
            <div>
              {/* Completed scrimmages content */}
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : completedScrimmages.length === 0 ? (
                <div className="p-12 text-center border rounded-lg">
                  <h3 className="text-lg font-medium">
                    No completed scrimmages
                  </h3>
                  <p className="mt-2 text-muted-foreground">
                    There are no completed scrimmages yet.
                  </p>
                </div>
              ) : (
                <CompletedScrimmages scrimmages={filteredCompletedScrimmages} />
              )}
            </div>
          )}
        </div>
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
              Are you sure you want to delete this scrimmage? This action cannot
              be undone.
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
  );
}
