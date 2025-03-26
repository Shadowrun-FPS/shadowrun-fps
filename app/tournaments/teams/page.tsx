"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ChallengeTeamDialog } from "@/components/teams/challenge-team-dialog";
import { CreateTeamForm } from "@/components/teams/create-team-form";
import {
  Trophy,
  Users,
  Star,
  TrendingUp,
  Search,
  Filter,
  CalendarDays,
  Medal,
  Shield,
  User,
  Plus,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Crown,
  Swords,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { FeatureGate } from "@/components/feature-gate";
import { toast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Team {
  _id: string;
  name: string;
  tag: string;
  description: string;
  captain: {
    discordId: string;
    discordNickname: string;
    discordProfilePicture: string;
  };
  members: {
    discordId: string;
    discordNickname: string;
    discordProfilePicture: string;
    role: string;
  }[];
  teamElo: number;
  tournaments?: string[];
  matchesPlayed?: number;
  wins?: number;
  losses?: number;
  lastActivity?: string;
}

interface Tournament {
  _id: string;
  name: string;
  description?: string;
  startDate: string;
  teamSize: number;
  registrationDeadline?: string;
  status: "upcoming" | "active" | "completed";
  teams?: number;
  format?: string;
  registeredTeams?: string[];
  maxTeams?: number;
}

export default function TeamsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [myTeam, setMyTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<string>("all");
  const [view, setView] = useState<string>("grid");
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [teamsPerPage, setTeamsPerPage] = useState(9); // 9 for grid view (3x3), adjust as needed
  const [totalPages, setTotalPages] = useState(1);

  const fetchTeams = useCallback(async () => {
    try {
      // First get all teams
      const response = await fetch("/api/teams");
      const teamsData = await response.json();
      setTeams(Array.isArray(teamsData) ? teamsData : []);

      // Find user's team
      const userTeam = teamsData.find((team: Team) =>
        team.members.some((member) => member.discordId === session?.user?.id)
      );
      setMyTeam(userTeam || null);

      // Fetch tournaments
      try {
        const tournamentResponse = await fetch("/api/tournaments");
        if (tournamentResponse.ok) {
          const tournamentData = await tournamentResponse.json();
          setTournaments(Array.isArray(tournamentData) ? tournamentData : []);

          // Enhance team data with tournament registration information
          if (Array.isArray(tournamentData) && tournamentData.length > 0) {
            // Create a mapping of team IDs to the tournaments they're registered in
            const teamTournamentMap = new Map();

            // Process each tournament to extract registered team IDs
            tournamentData.forEach((tournament: Tournament) => {
              if (
                tournament.registeredTeams &&
                Array.isArray(tournament.registeredTeams)
              ) {
                tournament.registeredTeams.forEach((team: any) => {
                  const teamId = typeof team === "object" ? team._id : team;
                  if (!teamTournamentMap.has(teamId)) {
                    teamTournamentMap.set(teamId, []);
                  }
                  teamTournamentMap.get(teamId).push(tournament._id);
                });
              }
            });

            // Enhance team objects with tournament data
            const enhancedTeams = teamsData.map((team: Team) => ({
              ...team,
              tournaments: teamTournamentMap.get(team._id.toString()) || [],
            }));

            setTeams(enhancedTeams);
          }
        }
      } catch (tournamentError) {
        console.error("Error fetching tournaments:", tournamentError);
        setTournaments([]);
      }

      setLoading(false);
    } catch (error) {
      console.error("Error fetching teams:", error);
      toast({
        title: "Error",
        description: "Failed to load teams",
        variant: "destructive",
      });
      setLoading(false);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    const fetchUserTeam = async () => {
      if (session?.user) {
        try {
          const response = await fetch("/api/teams/user-team");
          if (response.ok) {
            const data = await response.json();
            setMyTeam(data.team);
          }
        } catch (error) {
          console.error("Error fetching user team:", error);
        }
      }
    };

    fetchUserTeam();
  }, [session]);

  useEffect(() => {
    fetchTeams();
  }, [session?.user?.id, fetchTeams]);

  const filteredTeams = teams
    .filter((team) => !myTeam || team._id !== myTeam._id)
    .filter((team) => {
      // Filter by tournament if selected
      if (selectedTournament !== "all") {
        // Check if this team is registered for the selected tournament
        const isRegistered =
          // Check the team's tournaments array first
          (team.tournaments && team.tournaments.includes(selectedTournament)) ||
          // Also check if the team ID appears in the tournament's registeredTeams
          tournaments.some(
            (tournament) =>
              tournament._id === selectedTournament &&
              tournament.registeredTeams &&
              tournament.registeredTeams.some((regTeam: any) => {
                const regTeamId =
                  typeof regTeam === "object" ? regTeam._id : regTeam;
                return (
                  regTeamId === team._id || regTeamId === team._id.toString()
                );
              })
          );

        if (!isRegistered) return false;
      }

      // Search filtering with null checks
      if (searchTerm) {
        const lowercaseSearch = searchTerm.toLowerCase();
        return (
          (team.name && team.name.toLowerCase().includes(lowercaseSearch)) ||
          (team.tag && team.tag.toLowerCase().includes(lowercaseSearch)) ||
          (team.description &&
            team.description.toLowerCase().includes(lowercaseSearch)) ||
          (team.captain &&
            team.captain.discordNickname &&
            team.captain.discordNickname
              .toLowerCase()
              .includes(lowercaseSearch))
        );
      }

      return true;
    });

  // Update total pages whenever filtered teams change
  useEffect(() => {
    setTotalPages(Math.ceil(filteredTeams.length / teamsPerPage));
    // Reset to first page when filters change
    if (currentPage > 1 && filteredTeams.length <= teamsPerPage) {
      setCurrentPage(1);
    }
  }, [filteredTeams.length, teamsPerPage, currentPage]);

  // Get current page teams
  const indexOfLastTeam = currentPage * teamsPerPage;
  const indexOfFirstTeam = indexOfLastTeam - teamsPerPage;
  const currentTeams = filteredTeams.slice(indexOfFirstTeam, indexOfLastTeam);

  // Page change handler
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    // Scroll to top of list
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleChallengeClick = (team: Team) => {
    setSelectedTeam(team);
  };

  // Check if user is a team captain
  const isTeamCaptain =
    myTeam && myTeam.captain.discordId === session?.user?.id;

  // Add this function inside your TeamsPage component
  const isTeamFull = useCallback((team: { members: string | any[] }) => {
    // You can adjust this logic based on your requirements
    // For example, if a full team requires 5 members:
    return team && team.members && team.members.length >= 4;
  }, []);

  if (loading) {
    return (
      <div className="container py-8 mx-auto">
        <h1 className="mb-6 text-2xl font-bold">Teams</h1>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="p-6">
                  <Skeleton className="w-2/3 h-6 mb-2" />
                  <Skeleton className="w-full h-4 mb-4" />
                  <div className="flex items-center gap-2 mb-4">
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <Skeleton className="w-1/3 h-4" />
                  </div>
                  <Skeleton className="w-full h-20" />
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2 p-4 border-t">
                <Skeleton className="w-24 h-9" />
                <Skeleton className="w-24 h-9" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  function setOpen(arg0: boolean): void {
    throw new Error("Function not implemented.");
  }

  return (
    <FeatureGate feature="teams">
      <TooltipProvider>
        <div className="min-h-screen">
          <main className="container px-4 py-8 mx-auto">
            {/* Page Header */}
            <div className="flex flex-col gap-4 mb-8 md:items-center md:flex-row md:justify-between">
              <div>
                <h1 className="text-3xl font-bold">Teams</h1>
                <p className="text-muted-foreground">
                  Browse and manage competitive teams
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <Filter className="w-4 h-4" />
                      <span className="hidden sm:inline">Filter</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent>
                    <SheetHeader>
                      <SheetTitle>Filter Teams</SheetTitle>
                      <SheetDescription>
                        Narrow down teams based on tournaments and stats.
                      </SheetDescription>
                    </SheetHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <label className="text-sm font-medium">
                          Tournament
                        </label>
                        <Select
                          value={selectedTournament}
                          onValueChange={setSelectedTournament}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="All Tournaments" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Tournaments</SelectItem>
                            {Array.isArray(tournaments) &&
                            tournaments.length > 0 ? (
                              tournaments.map((tournament) => (
                                <SelectItem
                                  key={tournament._id}
                                  value={tournament._id}
                                >
                                  {tournament.name}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="none" disabled>
                                No tournaments available
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>

                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search teams..."
                    className="pl-9 w-full sm:w-[260px]"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <CreateTeamForm />
              </div>
            </div>

            {/* Active Tournaments Section */}
            <div className="mt-12">
              <h2 className="text-2xl font-bold">Active Tournaments</h2>
              <div className="grid grid-cols-1 gap-6 mt-4 md:grid-cols-2 lg:grid-cols-3">
                {tournaments
                  .filter(
                    (tournament) =>
                      tournament.status === "active" ||
                      tournament.status === "upcoming"
                  )
                  .map((tournament) => (
                    <Link
                      key={tournament._id}
                      href={`/tournaments/${tournament._id}`}
                      className="transition-transform hover:scale-[1.02]"
                    >
                      <Card className="h-full overflow-hidden border-t-4 border-t-primary">
                        <div className="flex flex-col h-full p-6">
                          {/* Tournament Header */}
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="text-xl font-bold">
                              {tournament.name}
                            </h3>
                            <Badge variant="outline" className="bg-muted/50">
                              {tournament.status === "upcoming"
                                ? "UPCOMING"
                                : tournament.status === "active"
                                ? "LIVE"
                                : "COMPLETED"}
                            </Badge>
                          </div>

                          {/* Tournament Format & Description */}
                          <div className="mb-4">
                            <p className="text-sm text-muted-foreground">
                              {tournament.format === "single_elimination"
                                ? "Single Elimination"
                                : "Double Elimination"}
                            </p>
                            <p className="mt-1 text-sm">
                              {tournament.description ||
                                "Our first tournament!"}
                            </p>
                          </div>

                          {/* Tournament Details Grid */}
                          <div className="grid grid-cols-2 gap-3 mt-auto">
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              <span>
                                {new Date(
                                  tournament.startDate
                                ).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Users className="w-4 h-4 text-muted-foreground" />
                              <span>
                                {tournament.registeredTeams?.length || 0}/
                                {tournament.maxTeams || 8} teams
                              </span>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  ))}

                {tournaments.filter(
                  (tournament) =>
                    tournament.status === "active" ||
                    tournament.status === "upcoming"
                ).length === 0 && (
                  <div className="p-8 text-center border border-dashed rounded-lg col-span-full">
                    <Trophy className="w-10 h-10 mx-auto text-muted-foreground opacity-30" />
                    <h3 className="mt-4 text-lg font-medium">
                      No Active Tournaments
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      There are no active tournaments at this time.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* My Team Section */}
            {myTeam && (
              <>
                <div className="mb-8">
                  <h2 className="mt-8 mb-4 text-xl font-semibold">My Team</h2>
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                    <Card className="overflow-hidden">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h3 className="text-xl font-bold">{myTeam.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              [{myTeam.tag}]
                            </p>
                          </div>
                          <div className="px-3 py-1 text-sm font-medium rounded-full bg-primary/10 text-primary">
                            {myTeam.teamElo || 3200} ELO
                          </div>
                        </div>
                        <p className="mb-4 text-muted-foreground">
                          {myTeam.description}
                        </p>

                        <div className="grid gap-4 mb-4 md:grid-cols-2">
                          <div className="flex items-center gap-2">
                            <Shield className="w-5 h-5 text-primary" />
                            <div>
                              <p className="text-sm font-medium">Captain</p>
                              <p className="text-sm text-muted-foreground">
                                {myTeam.captain.discordNickname || "Unknown"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-primary" />
                            <div>
                              <p className="text-sm font-medium">Members</p>
                              <p className="text-sm text-muted-foreground">
                                {myTeam.members.length} players
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-end gap-2 p-4 border-t">
                        <Button
                          variant="default"
                          onClick={() =>
                            router.push(`/tournaments/teams/${myTeam._id}`)
                          }
                        >
                          View Details
                        </Button>
                      </CardFooter>
                    </Card>

                    <Card className="border-dashed bg-primary/5 border-primary/30">
                      <CardContent className="flex flex-col items-center justify-center h-full py-8">
                        <h3 className="mb-2 text-lg font-medium">
                          Team Management
                        </h3>
                        <p className="mb-4 text-sm text-center text-muted-foreground">
                          Manage your team roster, invites, and tournament
                          registrations
                        </p>
                        <Button asChild>
                          <Link
                            href={`/tournaments/teams/${myTeam._id.toString()}`}
                          >
                            <Shield className="w-4 h-4 mr-2" />
                            Manage Team
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </div>
                <Separator className="my-8" />
              </>
            )}

            {/* All Teams Section */}
            <div className="mt-8">
              <div className="flex flex-col justify-between gap-4 mb-6 sm:flex-row sm:items-center">
                <div>
                  <h2 className="text-xl font-semibold">All Teams</h2>
                  <p className="text-sm text-muted-foreground">
                    Browse or search for teams
                  </p>
                </div>
                <div className="flex flex-col gap-4 sm:flex-row">
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="outline" className="gap-2">
                        <Filter className="w-4 h-4" />
                        <span className="hidden sm:inline">Filter</span>
                      </Button>
                    </SheetTrigger>
                    <SheetContent>
                      <SheetHeader>
                        <SheetTitle>Filter Teams</SheetTitle>
                        <SheetDescription>
                          Narrow down teams based on tournaments and stats.
                        </SheetDescription>
                      </SheetHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <label className="text-sm font-medium">
                            Tournament
                          </label>
                          <Select
                            value={selectedTournament}
                            onValueChange={setSelectedTournament}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="All Tournaments" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">
                                All Tournaments
                              </SelectItem>
                              {Array.isArray(tournaments) &&
                              tournaments.length > 0 ? (
                                tournaments.map((tournament) => (
                                  <SelectItem
                                    key={tournament._id}
                                    value={tournament._id}
                                  >
                                    {tournament.name}
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="none" disabled>
                                  No tournaments available
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </SheetContent>
                  </Sheet>

                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search teams..."
                      className="pl-9 w-full sm:w-[260px]"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Main content section with fixed Tabs structure */}
              <Tabs value={view} onValueChange={setView}>
                <div className="flex justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground">
                      {filteredTeams.length} teams found
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <TabsList className="h-8 p-1 border rounded-md bg-muted/80 border-border/50">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <TabsTrigger
                              value="grid"
                              className="w-8 h-6 p-0 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="transition-transform duration-200 ease-in-out group-hover:scale-110"
                              >
                                <rect x="3" y="3" width="7" height="7" rx="1" />
                                <rect
                                  x="14"
                                  y="3"
                                  width="7"
                                  height="7"
                                  rx="1"
                                />
                                <rect
                                  x="14"
                                  y="14"
                                  width="7"
                                  height="7"
                                  rx="1"
                                />
                                <rect
                                  x="3"
                                  y="14"
                                  width="7"
                                  height="7"
                                  rx="1"
                                />
                              </svg>
                            </TabsTrigger>
                          </TooltipTrigger>
                          <TooltipContent
                            side="bottom"
                            className="text-xs font-medium"
                          >
                            <p>Grid View</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <TabsTrigger
                              value="list"
                              className="w-8 h-6 p-0 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="transition-transform duration-200 ease-in-out group-hover:scale-110"
                              >
                                <line x1="3" y1="6" x2="21" y2="6" />
                                <line x1="3" y1="12" x2="21" y2="12" />
                                <line x1="3" y1="18" x2="21" y2="18" />
                              </svg>
                            </TabsTrigger>
                          </TooltipTrigger>
                          <TooltipContent
                            side="bottom"
                            className="text-xs font-medium"
                          >
                            <p>List View</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TabsList>
                  </div>
                </div>

                {loading ? (
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Card key={i} className="overflow-hidden">
                        <CardHeader>
                          <Skeleton className="h-6 w-36" />
                          <Skeleton className="w-24 h-4 mt-1" />
                        </CardHeader>
                        <CardContent>
                          <Skeleton className="w-full h-16" />
                          <div className="grid grid-cols-2 gap-2 mt-4">
                            <Skeleton className="w-full h-12" />
                            <Skeleton className="w-full h-12" />
                          </div>
                        </CardContent>
                        <CardFooter className="border-t">
                          <div className="flex justify-end w-full gap-2">
                            <Skeleton className="w-24 h-8" />
                            <Skeleton className="w-24 h-8" />
                          </div>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                ) : filteredTeams.length > 0 ? (
                  <>
                    <TabsContent value="grid">
                      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {currentTeams.map((team) => (
                          <Card
                            key={team._id}
                            className="overflow-hidden flex flex-col h-[340px]"
                          >
                            <CardHeader className="pb-2">
                              <div className="flex items-center justify-between mb-2">
                                <div>
                                  <h3 className="text-xl font-bold">
                                    {team.name}
                                  </h3>
                                  <p className="text-sm text-muted-foreground">
                                    [{team.tag}]
                                  </p>
                                </div>
                                <div className="px-3 py-1 text-sm font-medium rounded-full bg-primary/10 text-primary">
                                  {team.teamElo || 3200} ELO
                                </div>
                              </div>
                              <p className="mb-4 text-muted-foreground">
                                {team.description}
                              </p>
                            </CardHeader>
                            <CardContent className="flex-1">
                              <div className="flex flex-col space-y-4">
                                <div className="flex items-center gap-2">
                                  <Shield className="w-5 h-5 text-primary" />
                                  <div>
                                    <p className="text-sm font-medium">
                                      Captain
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      {team.captain.discordNickname ||
                                        "Unknown"}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Users className="w-5 h-5 text-primary" />
                                  <div>
                                    <p className="text-sm font-medium">
                                      Members
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      {team.members.length} players
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                            <CardFooter className="flex justify-end gap-2 p-4 border-t">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div>
                                      {team.members.length >= 4 ? (
                                        <ChallengeTeamDialog
                                          team={team}
                                          userTeam={myTeam ?? ({} as Team)}
                                        />
                                      ) : (
                                        <Button disabled={true} size="sm">
                                          <Swords className="w-5 h-5 mr-2" />
                                          Challenge
                                        </Button>
                                      )}
                                    </div>
                                  </TooltipTrigger>
                                  {team.members.length < 4 && (
                                    <TooltipContent>
                                      <p>
                                        Team needs at least 4 members to be
                                        challenged
                                      </p>
                                    </TooltipContent>
                                  )}
                                </Tooltip>
                              </TooltipProvider>

                              <Button
                                variant="outline"
                                onClick={() =>
                                  router.push(`/tournaments/teams/${team._id}`)
                                }
                              >
                                View Details
                              </Button>
                            </CardFooter>
                          </Card>
                        ))}
                      </div>
                    </TabsContent>

                    <TabsContent value="list">
                      <Card className="overflow-hidden">
                        {currentTeams.map((team) => (
                          <div
                            key={team._id}
                            className="p-4 border-b hover:bg-muted/30 last:border-b-0"
                          >
                            {/* Desktop and tablet layout (flex row) */}
                            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                              {/* Team name and tag */}
                              <div className="flex-shrink-0">
                                <div className="text-lg font-bold">
                                  {team.name}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  [{team.tag}]
                                </div>
                              </div>

                              {/* Team info - responsive layout */}
                              <div className="flex flex-col w-full gap-4 md:flex-row md:items-center md:gap-8 md:w-auto">
                                {/* Captain, Members, Record - stack on mobile, row on larger screens */}
                                <div className="grid grid-cols-3 gap-4 md:flex md:items-center md:gap-6">
                                  <div className="flex flex-col items-start">
                                    <div className="flex items-center gap-1">
                                      <Shield className="w-4 h-4 text-muted-foreground" />
                                      <span className="text-sm font-medium">
                                        Captain:
                                      </span>
                                    </div>
                                    <span className="text-sm truncate max-w-[120px]">
                                      {team.captain.discordNickname ||
                                        "Unknown"}
                                    </span>
                                  </div>

                                  <div className="flex flex-col items-start">
                                    <div className="flex items-center gap-1">
                                      <Users className="w-4 h-4 text-muted-foreground" />
                                      <span className="text-sm font-medium">
                                        Members:
                                      </span>
                                    </div>
                                    <span className="text-sm">
                                      {team.members.length} players
                                    </span>
                                  </div>

                                  <div className="flex flex-col items-start">
                                    <div className="flex items-center gap-1">
                                      <Trophy className="w-4 h-4 text-muted-foreground" />
                                      <span className="text-sm font-medium">
                                        Record:
                                      </span>
                                    </div>
                                    <span className="text-sm">
                                      {team.wins || 0}-{team.losses || 0}
                                    </span>
                                  </div>
                                </div>

                                {/* ELO and Actions - stack on mobile, row on larger screens */}
                                <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-6">
                                  {/* ELO */}
                                  <div className="px-3 py-1 text-sm font-medium rounded-md bg-accent/80 text-foreground w-fit">
                                    {team.teamElo || 3200} ELO
                                  </div>

                                  {/* Actions */}
                                  <div className="flex gap-2">
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <div>
                                            {team.members.length >= 4 ? (
                                              <ChallengeTeamDialog
                                                team={team}
                                                userTeam={
                                                  myTeam ?? ({} as Team)
                                                }
                                              />
                                            ) : (
                                              <Button
                                                variant="default"
                                                size="sm"
                                                disabled
                                              >
                                                <Swords className="w-4 h-4 mr-2" />
                                                Challenge
                                              </Button>
                                            )}
                                          </div>
                                        </TooltipTrigger>
                                        {team.members.length < 4 && (
                                          <TooltipContent>
                                            <p>
                                              Team needs at least 4 members to
                                              be challenged
                                            </p>
                                          </TooltipContent>
                                        )}
                                      </Tooltip>
                                    </TooltipProvider>

                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        router.push(
                                          `/tournaments/teams/${team._id}`
                                        )
                                      }
                                    >
                                      <ChevronRight className="w-4 h-4 mr-2" />
                                      View Details
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Tournament badges */}
                            <div className="flex flex-wrap gap-2 mt-3">
                              {team.tournaments &&
                              team.tournaments.length > 0 ? (
                                team.tournaments.map((tournamentId, index) => {
                                  const tournament = tournaments.find(
                                    (t) => t._id === tournamentId
                                  );
                                  return tournament ? (
                                    <Badge
                                      key={index}
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {tournament.name}
                                    </Badge>
                                  ) : null;
                                })
                              ) : (
                                <>
                                  <Badge variant="outline" className="text-xs">
                                    Summer Championship 2025
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    2025 Summer Seasonal
                                  </Badge>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </Card>
                    </TabsContent>

                    {/* Pagination UI - Updated for responsiveness */}
                    {totalPages > 1 && (
                      <div className="flex flex-col p-4 mt-6 border rounded-md bg-card sm:flex-row sm:items-center sm:justify-between">
                        <div className="mb-4 text-sm text-muted-foreground sm:mb-0">
                          Showing {indexOfFirstTeam + 1} to{" "}
                          {Math.min(indexOfLastTeam, filteredTeams.length)} of{" "}
                          {filteredTeams.length} teams
                        </div>

                        <div className="flex flex-wrap justify-center gap-2 sm:justify-end">
                          {/* On mobile, show simplified controls */}
                          <div className="flex gap-2 sm:hidden">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handlePageChange(Math.max(1, currentPage - 1))
                              }
                              disabled={currentPage === 1}
                              className="w-8 h-8 p-0"
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </Button>

                            <div className="flex items-center h-8 px-3 text-sm border rounded-md bg-background border-input">
                              {currentPage} / {totalPages}
                            </div>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handlePageChange(
                                  Math.min(totalPages, currentPage + 1)
                                )
                              }
                              disabled={currentPage === totalPages}
                              className="w-8 h-8 p-0"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </Button>
                          </div>

                          {/* On larger screens, show full controls */}
                          <div className="hidden sm:flex sm:gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePageChange(1)}
                              disabled={currentPage === 1}
                              className="h-8 px-3"
                            >
                              First
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handlePageChange(Math.max(1, currentPage - 1))
                              }
                              disabled={currentPage === 1}
                              className="h-8 px-3"
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </Button>

                            <div className="flex items-center h-8 px-3 text-sm border rounded-md bg-background border-input">
                              Page {currentPage} of {totalPages}
                            </div>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handlePageChange(
                                  Math.min(totalPages, currentPage + 1)
                                )
                              }
                              disabled={currentPage === totalPages}
                              className="h-8 px-3"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePageChange(totalPages)}
                              disabled={currentPage === totalPages}
                              className="h-8 px-3"
                            >
                              Last
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <Card className="flex items-center justify-center p-8">
                    <div className="text-center">
                      <Users className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
                      <h3 className="text-lg font-medium">No Teams Found</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {searchTerm
                          ? `No teams match "${searchTerm}"`
                          : selectedTournament !== "all"
                          ? "No teams found for this tournament"
                          : "Create the first team to get started!"}
                      </p>
                      <Sheet>
                        <SheetTrigger asChild>
                          <Button className="mt-4">
                            <Plus className="w-4 h-4 mr-2" />
                            Create a Team
                          </Button>
                        </SheetTrigger>
                        <SheetContent>
                          <SheetHeader>
                            <SheetTitle>Create New Team</SheetTitle>
                            <SheetDescription>
                              Fill out the form to create your team.
                            </SheetDescription>
                          </SheetHeader>
                          <CreateTeamForm
                            onSuccess={() => {
                              fetchTeams();
                              // Close the sheet after successful creation
                            }}
                          />
                        </SheetContent>
                      </Sheet>
                    </div>
                  </Card>
                )}
              </Tabs>
            </div>
          </main>
        </div>
      </TooltipProvider>
    </FeatureGate>
  );
}
