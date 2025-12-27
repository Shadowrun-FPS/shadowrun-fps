"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { format, isPast, isFuture, isToday } from "date-fns";
import {
  Trophy,
  Users,
  Calendar,
  Clock,
  Filter,
  Search,
  Plus,
  ArrowRight,
  CalendarDays,
  ListFilter,
  CheckCircle,
  Clock8,
  X,
  PlusCircle,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/ui/use-toast";
import { FeatureGate } from "@/components/feature-gate";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Skeleton } from "@/components/ui/skeleton";
import { CreateTournamentDialog } from "@/components/tournaments/create-tournament-dialog";
import { TournamentCard } from "@/components/tournaments/tournament-card";

// Create these components if they don't exist
interface EmptyStateProps {
  title: string;
  description: string;
  icon: React.ReactNode;
}

const EmptyState = ({ title, description, icon }: EmptyStateProps) => (
  <Card className="p-8 text-center">
    <div className="flex justify-center items-center mx-auto mb-4 w-14 h-14 rounded-full bg-muted">
      {icon}
    </div>
    <h3 className="mb-2 text-lg font-semibold">{title}</h3>
    <p className="mb-4 text-muted-foreground">{description}</p>
  </Card>
);

interface Tournament {
  _id: string;
  name: string;
  description?: string;
  startDate: string;
  teamSize: number;
  format: "single_elimination" | "double_elimination";
  status: "upcoming" | "active" | "completed";
  registrationDeadline?: string;
  registeredTeams: { _id: string; name: string; tag: string }[];
  maxTeams?: number;
}

// Create a client component that uses useSearchParams
function TournamentsOverviewContent() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [formatFilter, setFormatFilter] = useState("all");
  const [teamSizeFilter, setTeamSizeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [canCreateTournament, setCanCreateTournament] = useState(false);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const { toast } = useToast();

  // Wrap fetchTournaments in useCallback to avoid infinite loops
  const fetchTournaments = useCallback(async () => {
    try {
      setLoading(true);
      // ✅ Use deduplication for tournaments
      const { deduplicatedFetch } = await import("@/lib/request-deduplication");
      const data = await deduplicatedFetch<any[]>("/api/tournaments", {
        ttl: 30000, // Cache for 30 seconds
      });
      setTournaments(data);

      // Only check permissions if user is authenticated
      if (status === "authenticated") {
        // ✅ Use unified endpoint with deduplication
        const { deduplicatedFetch } = await import("@/lib/request-deduplication");
        const userData = await deduplicatedFetch<{
          permissions: {
            isAdmin: boolean;
            isModerator: boolean;
            isDeveloper: boolean;
          };
        }>("/api/user/data", {
          ttl: 60000, // Cache for 1 minute
        });

        // Allow tournament creation for admins, mods, and the developer
        setCanCreateTournament(
          userData.permissions.isAdmin ||
            userData.permissions.isModerator ||
            userData.permissions.isDeveloper ||
            false
        );
      }

      // Determine which tab to show initially
      const hasActiveTournaments = data.some((t: any) => t.status === "active");
      const hasUpcomingTournaments = data.some(
        (t: any) => t.status === "upcoming"
      );

      // If URL has a tab parameter, use that
      if (tabParam && ["active", "upcoming", "completed"].includes(tabParam)) {
        setActiveTab(tabParam);
      }
      // Otherwise, select based on available tournaments
      else if (hasActiveTournaments) {
        setActiveTab("active");
      } else if (hasUpcomingTournaments) {
        setActiveTab("upcoming");
      } else {
        setActiveTab("completed");
      }
    } catch (error) {
      console.error("Error fetching tournaments:", error);
      toast({
        title: "Error",
        description: "Failed to load tournaments. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [tabParam, toast, status]);

  useEffect(() => {
    // Remove the authentication check to allow data loading for all users
    fetchTournaments();
  }, [fetchTournaments]);

  // Filter tournaments based on search term and filters
  const filteredTournaments = tournaments.filter((tournament) => {
    // Search filter
    if (
      searchTerm &&
      !tournament.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !(
        tournament.description &&
        tournament.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    ) {
      return false;
    }

    // Format filter
    if (formatFilter !== "all" && tournament.format !== formatFilter) {
      return false;
    }

    // Team size filter
    if (
      teamSizeFilter !== "all" &&
      tournament.teamSize !== parseInt(teamSizeFilter)
    ) {
      return false;
    }

    // Status filter
    if (statusFilter !== "all" && tournament.status !== statusFilter) {
      return false;
    }

    return true;
  });

  // Group tournaments by status for tabs and sort by start date (soonest first)
  const upcomingTournaments = filteredTournaments
    .filter((t) => t.status === "upcoming")
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  const activeTournaments = filteredTournaments
    .filter((t) => t.status === "active")
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  const completedTournaments = filteredTournaments
    .filter((t) => t.status === "completed")
    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    router.push(`/tournaments/overview?tab=${value}`, { scroll: false });
  };

  // Don't render until we've determined the initial tab
  if (!activeTab) {
    return (
      <div className="container py-8">
        <div className="space-y-4">
          <Skeleton className="w-full max-w-md h-10" />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="w-full h-64 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <FeatureGate feature="tournaments">
      <div className="container px-4 py-6 mx-auto sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 mb-8 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex gap-3 items-center mb-2">
              <div className="p-2 rounded-lg border bg-primary/10 border-primary/20">
                <Trophy className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight bg-clip-text bg-gradient-to-r sm:text-4xl from-foreground to-foreground/70">
                Tournaments
              </h1>
            </div>
            <p className="text-sm text-muted-foreground sm:text-base">
              Browse and register for competitive tournaments
            </p>
          </div>
          {canCreateTournament && (
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="flex gap-2 items-center w-full sm:w-auto"
              size="lg"
            >
              <PlusCircle className="w-4 h-4" />
              Create Tournament
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4 mt-6 sm:mt-8">
          {/* Search and Clear All row */}
          <div className="flex flex-col gap-2 items-stretch sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search tournaments..."
                className="pl-9 h-11"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute p-1.5 rounded-full right-2 top-1/2 -translate-y-1/2 hover:bg-muted touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
            </div>

            {/* Clear All Filters Button - only show if any filter is active */}
            {(formatFilter !== "all" ||
              teamSizeFilter !== "all" ||
              statusFilter !== "all" ||
              searchTerm) && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setFormatFilter("all");
                  setTeamSizeFilter("all");
                  setStatusFilter("all");
                  setSearchTerm("");
                }}
                className="h-11 whitespace-nowrap touch-manipulation"
              >
                <X className="w-4 h-4 mr-1.5" />
                Clear All
              </Button>
            )}
          </div>

          {/* Filter controls */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {/* Format Filter */}
            <Select
              value={formatFilter}
              onValueChange={(value) => setFormatFilter(value)}
            >
              <SelectTrigger className="relative pr-3 pl-10 w-full h-11">
                <Filter className="absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 pointer-events-none text-muted-foreground" />
                <SelectValue placeholder="Format" className="pl-0">
                  {formatFilter === "all"
                    ? "Format"
                    : formatFilter === "single_elimination"
                    ? "Single Elim"
                    : "Double Elim"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Formats</SelectItem>
                <SelectItem value="single_elimination">
                  Single Elimination
                </SelectItem>
                <SelectItem value="double_elimination">
                  Double Elimination
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Team Size Filter */}
            <Select
              value={teamSizeFilter}
              onValueChange={(value) => setTeamSizeFilter(value)}
            >
              <SelectTrigger className="relative pr-3 pl-10 w-full h-11">
                <Users className="absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 pointer-events-none text-muted-foreground" />
                <SelectValue placeholder="Team Size" className="pl-0">
                  {teamSizeFilter === "all"
                    ? "Team Size"
                    : `${teamSizeFilter}v${teamSizeFilter}`}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sizes</SelectItem>
                <SelectItem value="1">1v1</SelectItem>
                <SelectItem value="2">2v2</SelectItem>
                <SelectItem value="3">3v3</SelectItem>
                <SelectItem value="4">4v4</SelectItem>
                <SelectItem value="5">5v5</SelectItem>
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value)}
            >
              <SelectTrigger className="relative pr-3 pl-10 w-full h-11">
                <Clock className="absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 pointer-events-none text-muted-foreground" />
                <SelectValue placeholder="Status" className="pl-0">
                  {statusFilter === "all"
                    ? "Status"
                    : statusFilter.charAt(0).toUpperCase() +
                      statusFilter.slice(1)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {searchTerm ||
        formatFilter !== "all" ||
        teamSizeFilter !== "all" ||
        statusFilter !== "all" ? (
          // When filters are active, show filtered results
          <div className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Search Results</h2>
              <Badge variant="outline" className="font-normal">
                {filteredTournaments.length} tournaments found
              </Badge>
            </div>

            {loading ? (
              <div className="grid gap-4 mt-6 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="overflow-hidden">
                    <CardHeader>
                      <Skeleton className="w-24 h-4" />
                      <Skeleton className="mt-2 w-full h-6" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="mb-2 w-full h-4" />
                      <Skeleton className="w-3/4 h-4" />
                    </CardContent>
                    <CardFooter className="border-t">
                      <div className="flex justify-end w-full">
                        <Skeleton className="w-28 h-9" />
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : filteredTournaments.length > 0 ? (
              <div className="grid gap-4 mt-6 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredTournaments.map((tournament) => (
                  <TournamentCard
                    key={tournament._id}
                    tournament={tournament}
                  />
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center">
                <div className="flex justify-center items-center mx-auto mb-4 w-14 h-14 rounded-full bg-muted">
                  <X className="w-6 h-6 text-muted-foreground" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">
                  No tournaments found
                </h3>
                <p className="mb-4 text-muted-foreground">
                  Try adjusting your search or filters to find what you&apos;re
                  looking for.
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("");
                    setFormatFilter("all");
                    setTeamSizeFilter("all");
                    setStatusFilter("all");
                  }}
                >
                  Clear Filters
                </Button>
              </Card>
            )}
          </div>
        ) : (
          // Default view with tabs (no filters active)
          <div className="mt-6 sm:mt-8">
            <Tabs
              value={activeTab}
              onValueChange={handleTabChange}
              className="space-y-6 sm:space-y-8"
            >
              <TabsList className="grid w-full grid-cols-3 h-auto p-1 sm:p-1.5">
                <TabsTrigger
                  value="active"
                  className="flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 text-sm sm:text-base touch-manipulation min-h-[44px]"
                >
                  <Clock className="w-4 h-4 sm:w-4 sm:h-4" />
                  <span>Active</span>
                  {activeTournaments.length > 0 && (
                    <span className="px-1.5 sm:px-2 ml-0.5 sm:ml-1 text-xs rounded-full bg-primary text-primary-foreground min-w-[20px] text-center">
                      {activeTournaments.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="upcoming"
                  className="flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 text-sm sm:text-base touch-manipulation min-h-[44px]"
                >
                  <CalendarDays className="w-4 h-4 sm:w-4 sm:h-4" />
                  <span>Upcoming</span>
                  {upcomingTournaments.length > 0 && (
                    <span className="px-1.5 sm:px-2 ml-0.5 sm:ml-1 text-xs rounded-full bg-primary text-primary-foreground min-w-[20px] text-center">
                      {upcomingTournaments.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="completed"
                  className="flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 text-sm sm:text-base touch-manipulation min-h-[44px]"
                >
                  <CheckCircle className="w-4 h-4 sm:w-4 sm:h-4" />
                  <span>Completed</span>
                  {completedTournaments.length > 0 && (
                    <span className="px-1.5 sm:px-2 ml-0.5 sm:ml-1 text-xs rounded-full bg-primary text-primary-foreground min-w-[20px] text-center">
                      {completedTournaments.length}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="active" className="space-y-6">
                {loading ? (
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="w-full h-64 rounded-lg" />
                    ))}
                  </div>
                ) : activeTournaments.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {activeTournaments.map((tournament) => (
                      <TournamentCard
                        key={tournament._id}
                        tournament={tournament}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title="No active tournaments"
                    description="There are no tournaments currently in progress. Check upcoming tournaments or create your own!"
                    icon={<Clock className="w-12 h-12 text-muted-foreground" />}
                  />
                )}
              </TabsContent>

              <TabsContent value="upcoming" className="space-y-6">
                {loading ? (
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="w-full h-64 rounded-lg" />
                    ))}
                  </div>
                ) : upcomingTournaments.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {upcomingTournaments.map((tournament) => (
                      <TournamentCard
                        key={tournament._id}
                        tournament={tournament}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title="No upcoming tournaments"
                    description="There are no upcoming tournaments scheduled. Check back later or create your own!"
                    icon={
                      <CalendarDays className="w-12 h-12 text-muted-foreground" />
                    }
                  />
                )}
              </TabsContent>

              <TabsContent value="completed" className="space-y-6">
                {loading ? (
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="w-full h-64 rounded-lg" />
                    ))}
                  </div>
                ) : completedTournaments.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {completedTournaments.map((tournament) => (
                      <TournamentCard
                        key={tournament._id}
                        tournament={tournament}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title="No completed tournaments"
                    description="There are no completed tournaments yet. Check active or upcoming tournaments!"
                    icon={
                      <CheckCircle className="w-12 h-12 text-muted-foreground" />
                    }
                  />
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}

        <CreateTournamentDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          onSuccess={fetchTournaments}
        />
      </div>
    </FeatureGate>
  );
}

// Main page component that wraps the content in Suspense
export default function TournamentsOverviewPage() {
  return (
    <Suspense
      fallback={<div className="p-8 text-center">Loading tournaments...</div>}
    >
      <TournamentsOverviewContent />
    </Suspense>
  );
}
