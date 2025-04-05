"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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

export default function TournamentsOverviewPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [formatFilter, setFormatFilter] = useState("all");
  const [teamSizeFilter, setTeamSizeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Check if user has permission to create tournaments
  const canCreateTournament =
    session?.user?.roles?.includes("admin") ||
    session?.user?.roles?.includes("moderator") ||
    session?.user?.id === "YOUR_USER_ID"; // Replace with your actual user ID

  // Move fetchTournaments outside useEffect to component scope
  const fetchTournaments = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/tournaments");
      if (response.ok) {
        const data = await response.json();
        setTournaments(data);
      } else {
        console.error("Failed to fetch tournaments");
      }
    } catch (error) {
      console.error("Error fetching tournaments:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTournaments();
  }, []);

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

  // Tournament card component
  const TournamentCard = ({ tournament }: { tournament: Tournament }) => {
    const startDate = new Date(tournament.startDate);
    const isUpcoming = tournament.status === "upcoming";
    const isActive = tournament.status === "active";
    const teamsCount = tournament.registeredTeams?.length || 0;
    const maxTeams = tournament.maxTeams || 8;
    const teamsProgress = (teamsCount / maxTeams) * 100;

    return (
      <Card className="overflow-hidden transition-all border-l-4 hover:shadow-md border-l-primary/30 hover:border-l-primary">
        <CardHeader className="pb-2">
          <div className="flex justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    isUpcoming ? "secondary" : isActive ? "default" : "outline"
                  }
                >
                  {isUpcoming ? "Upcoming" : isActive ? "Active" : "Completed"}
                </Badge>
                <Badge variant="outline" className="font-normal">
                  {tournament.format === "single_elimination"
                    ? "Single Elimination"
                    : "Double Elimination"}
                </Badge>
              </div>
              <CardTitle className="mt-2 text-xl">{tournament.name}</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            <div className="flex items-center text-sm">
              <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
              <span>
                {format(startDate, "MMMM d, yyyy")} at{" "}
                {format(startDate, "h:mm a")}
              </span>
            </div>
            <div className="flex items-center text-sm">
              <Users className="w-4 h-4 mr-2 text-muted-foreground" />
              <span>
                {tournament.teamSize}v{tournament.teamSize} • {teamsCount}/
                {maxTeams} Teams
              </span>
            </div>
            {tournament.description && (
              <p className="mt-1 text-sm text-muted-foreground">
                {tournament.description.length > 120
                  ? `${tournament.description.substring(0, 120)}...`
                  : tournament.description}
              </p>
            )}
          </div>
        </CardContent>
        <div className="h-1 bg-muted">
          <div
            className="h-full bg-primary"
            style={{ width: `${teamsProgress}%` }}
          ></div>
        </div>
        <CardFooter className="flex justify-between p-4 border-t">
          <div className="text-sm text-muted-foreground">
            {isUpcoming && tournament.registrationDeadline && (
              <span className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                Registration closes on{" "}
                {format(
                  new Date(tournament.registrationDeadline),
                  "MMM d, yyyy"
                )}
              </span>
            )}
          </div>
          <Button asChild>
            <Link href={`/tournaments/${tournament._id}`}>
              View Details
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </CardFooter>
      </Card>
    );
  };

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
      <div className="flex flex-col gap-4 mt-8 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tournaments..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex flex-1 gap-2">
          <Select value={formatFilter} onValueChange={setFormatFilter}>
            <SelectTrigger className="w-full">
              <div className="flex items-center">
                <Trophy className="w-4 h-4 mr-2" />
                <span>Format</span>
              </div>
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

          <Select value={teamSizeFilter} onValueChange={setTeamSizeFilter}>
            <SelectTrigger className="w-full">
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-2" />
                <span>Team Size</span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sizes</SelectItem>
              {/* <SelectItem className="disabled" value="1">
                1v1
              </SelectItem>
              <SelectItem className="disabled" value="2">
                2v2
              </SelectItem>
              <SelectItem className="disabled" value="3">
                3v3
              </SelectItem> */}
              <SelectItem value="4">4v4</SelectItem>
              {/* <SelectItem className="disabled" value="5">
                5v5
              </SelectItem>
              <SelectItem className="disabled" value="6">
                6v6
              </SelectItem> */}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full">
              <div className="flex items-center">
                <CalendarDays className="w-4 h-4 mr-2" />
                <span>Status</span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
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
        <Tabs defaultValue="active" className="mt-6">
          <TabsList className="w-full mb-6">
            <TabsTrigger value="active" className="flex-1">
              <Clock8 className="w-4 h-4 mr-2" />
              Active
              <Badge variant="secondary" className="ml-2">
                {activeTournaments.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="flex-1">
              <Calendar className="w-4 h-4 mr-2" />
              Upcoming
              <Badge variant="secondary" className="ml-2">
                {upcomingTournaments.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex-1">
              <CheckCircle className="w-4 h-4 mr-2" />
              Completed
              <Badge variant="secondary" className="ml-2">
                {completedTournaments.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            {loading ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
            ) : activeTournaments.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {activeTournaments.map((tournament) => (
                  <TournamentCard
                    key={tournament._id}
                    tournament={tournament}
                  />
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center">
                <div className="flex items-center justify-center mx-auto mb-4 rounded-full bg-muted w-14 h-14">
                  <Clock8 className="w-6 h-6 text-muted-foreground" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">
                  No active tournaments
                </h3>
                <p className="mb-4 text-muted-foreground">
                  There are no tournaments currently in progress. Check upcoming
                  tournaments or create your own!
                </p>
                {canCreateTournament && (
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    Create Tournament
                  </Button>
                )}
              </Card>
            )}
          </TabsContent>

          <TabsContent value="upcoming">
            {loading ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
            ) : upcomingTournaments.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {upcomingTournaments.map((tournament) => (
                  <TournamentCard
                    key={tournament._id}
                    tournament={tournament}
                  />
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center">
                <div className="flex items-center justify-center mx-auto mb-4 rounded-full bg-muted w-14 h-14">
                  <Calendar className="w-6 h-6 text-muted-foreground" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">
                  No upcoming tournaments
                </h3>
                <p className="mb-4 text-muted-foreground">
                  There are no tournaments scheduled for the future. Be the
                  first to create one!
                </p>
                {canCreateTournament && (
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    Create Tournament
                  </Button>
                )}
              </Card>
            )}
          </TabsContent>

          <TabsContent value="completed">
            {loading ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
            ) : completedTournaments.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {completedTournaments.map((tournament) => (
                  <TournamentCard
                    key={tournament._id}
                    tournament={tournament}
                  />
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center">
                <div className="flex items-center justify-center mx-auto mb-4 rounded-full bg-muted w-14 h-14">
                  <CheckCircle className="w-6 h-6 text-muted-foreground" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">
                  No completed tournaments
                </h3>
                <p className="mb-4 text-muted-foreground">
                  There are no completed tournaments yet. Check active or
                  upcoming tournaments.
                </p>
              </Card>
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
