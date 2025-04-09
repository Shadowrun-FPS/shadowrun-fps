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
    <div className="flex items-center justify-center mx-auto mb-4 rounded-full bg-muted w-14 h-14">
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

  // Wrap fetchTournaments in useCallback to avoid infinite loops
  const fetchTournaments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/tournaments");
      const data = await response.json();
      setTournaments(data);

      // Check if user has permission to create tournaments
      const userResponse = await fetch("/api/user/permissions");
      const userData = await userResponse.json();

      // Allow tournament creation for admins, mods, and the developer
      setCanCreateTournament(
        userData.isAdmin ||
          userData.isModerator ||
          userData.isDeveloper ||
          false
      );

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
    } finally {
      setLoading(false);
    }
  }, [tabParam]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchTournaments();
    }
  }, [status, session, fetchTournaments]);

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

  // Group tournaments by status for tabs
  const upcomingTournaments = filteredTournaments.filter(
    (t) => t.status === "upcoming"
  );
  const activeTournaments = filteredTournaments.filter(
    (t) => t.status === "active"
  );
  const completedTournaments = filteredTournaments.filter(
    (t) => t.status === "completed"
  );

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
          <Skeleton className="w-full h-10 max-w-md" />
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
    <div className="container px-4 py-6 mx-auto">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tournaments</h1>
          <p className="text-muted-foreground">
            Browse and register for competitive tournaments
          </p>
        </div>
        {canCreateTournament && (
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            className="flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            Create Tournament
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 mt-4 md:mt-0">
        {/* Search and Clear All row */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute w-4 h-4 left-2.5 top-2.5 text-muted-foreground" />
            <Input
              placeholder="Search tournaments..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute p-1 rounded-full right-2 top-2 hover:bg-muted"
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
              className="whitespace-nowrap"
            >
              <X className="w-4 h-4 mr-1" />
              Clear All
            </Button>
          )}
        </div>

        {/* Filter controls */}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {/* Format Filter */}
          <Select
            value={formatFilter}
            onValueChange={(value) => setFormatFilter(value)}
          >
            <SelectTrigger className="w-full pl-8 h-9">
              <Filter className="absolute w-4 h-4 left-2 text-muted-foreground" />
              <SelectValue placeholder="Format">
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
            <SelectTrigger className="w-full pl-8 h-9">
              <Users className="absolute w-4 h-4 left-2 text-muted-foreground" />
              <SelectValue placeholder="Team Size">
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
            <SelectTrigger className="w-full pl-8 h-9">
              <Clock className="absolute w-4 h-4 left-2 text-muted-foreground" />
              <SelectValue placeholder="Status">
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
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Search Results</h2>
            <Badge variant="outline" className="font-normal">
              {filteredTournaments.length} tournaments found
            </Badge>
          </div>

          {loading ? (
            <div className="grid gap-6 mt-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="overflow-hidden">
                  <CardHeader>
                    <Skeleton className="w-24 h-4" />
                    <Skeleton className="w-full h-6 mt-2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="w-full h-4 mb-2" />
                    <Skeleton className="w-3/4 h-4" />
                  </CardContent>
                  <CardFooter className="border-t">
                    <div className="flex justify-end w-full">
                      <Skeleton className="h-9 w-28" />
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : filteredTournaments.length > 0 ? (
            <div className="grid gap-6 mt-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredTournaments.map((tournament) => (
                <TournamentCard key={tournament._id} tournament={tournament} />
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <div className="flex items-center justify-center mx-auto mb-4 rounded-full bg-muted w-14 h-14">
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
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="space-y-8"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="active" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>Active</span>
              {activeTournaments.length > 0 && (
                <span className="px-2 ml-1 text-xs rounded-full bg-primary text-primary-foreground">
                  {activeTournaments.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4" />
              <span>Upcoming</span>
              {upcomingTournaments.length > 0 && (
                <span className="px-2 ml-1 text-xs rounded-full bg-primary text-primary-foreground">
                  {upcomingTournaments.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>Completed</span>
              {completedTournaments.length > 0 && (
                <span className="px-2 ml-1 text-xs rounded-full bg-primary text-primary-foreground">
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
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
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
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
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
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
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
      )}

      <CreateTournamentDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={fetchTournaments}
      />
    </div>
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
