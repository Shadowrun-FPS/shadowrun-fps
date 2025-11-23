"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
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
  X,
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
  SheetTrigger,
} from "@/components/ui/sheet";
import { TeamCard } from "@/components/teams/team-card";
import { ChallengeTeamDialog } from "@/components/teams/challenge-team-dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

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
    discordUsername?: string;
    elo?: any;
    joinedAt?: string;
    role: string;
  }[];
  teamElo: number;
  tournaments?: string[];
  wins?: number;
  losses?: number;

  tournamentWins?: number;
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
  const [userTeam, setUserTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<string>("all");
  const [view, setView] = useState<string>("grid");
  const [teamStatus, setTeamStatus] = useState<"all" | "full" | "open">("all");
  const [sheetOpen, setSheetOpen] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [teamsPerPage, setTeamsPerPage] = useState(9); // 9 for grid view (3x3), adjust as needed
  const [totalPages, setTotalPages] = useState(1);

  const fetchTeams = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/teams");

      if (!response.ok) {
        throw new Error(`Failed to fetch teams: ${response.statusText}`);
      }

      const data = await response.json();

      // Ensure data is an array
      const teamsArray = Array.isArray(data) ? data : [];

      // Set teams directly if it's already an array
      setTeams(teamsArray);

      // Find user's team if logged in
      if (session?.user?.id) {
        const userTeam = teamsArray.find(
          (team) =>
            team.members?.some(
              (member: { discordId: string }) =>
                member.discordId === session.user.id
            ) || team.captain?.discordId === session.user.id
        );
        setUserTeam(userTeam || null);
      }

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
            const enhancedTeams = teamsArray.map((team: Team) => ({
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
    } catch (error) {
      console.error("Error fetching teams:", error);
      // Set empty arrays as fallback
      setTeams([]);
      setUserTeam(null);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    fetchTeams();
  }, [session?.user?.id, fetchTeams]);

  const filteredTeams = teams
    .filter((team) => !userTeam || team._id !== userTeam._id)
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

      // Filter by team status (full or open)
      if (teamStatus !== "all") {
        // Most teams need at least 4 players to be considered full
        const isFull = (team.members?.length || 0) >= 4;

        if (teamStatus === "full" && !isFull) return false;
        if (teamStatus === "open" && isFull) return false;
      }

      // Search filtering with null checks
      if (searchQuery) {
        const lowercaseSearch = searchQuery.toLowerCase();
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

  const handleChallenge = (teamId: string) => {
    // Implementation of handleChallenge function
  };

  const getTeamRankings = (teams: string | any[]) => {
    if (!Array.isArray(teams) || teams.length === 0) {
      return [];
    }

    // Make a copy of the array before sorting
    return [...teams]
      .sort((a, b) => (b.teamElo || 0) - (a.teamElo || 0))
      .map((team, index) => ({
        ...team,
        rank: index + 1,
      }));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    // Format as "Month DD, YYYY" (e.g., "July 6, 2025")
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <FeatureGate feature="teams">
      <TooltipProvider>
        <div className="min-h-screen bg-background">
          <main className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-6 sm:py-8 lg:py-10">
            {/* Page Header */}
            <div className="flex flex-col gap-4 mb-8 sm:mb-10 md:items-center md:flex-row md:justify-between">
              <div className="flex items-center gap-3">
                <div className="relative p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 border-2 border-primary/30 shadow-lg shadow-primary/10 shrink-0">
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/40 to-transparent opacity-50" />
                  <Shield className="relative w-6 h-6 sm:w-7 sm:h-7 text-primary drop-shadow-sm" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-foreground to-foreground/80">
                    Teams
                  </h1>
                  <p className="text-sm sm:text-base text-muted-foreground mt-1">
                    Browse and manage competitive teams
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search teams..."
                    className="pl-9 w-full sm:w-[260px]"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <CreateTeamForm />
              </div>
            </div>

            {/* Active Tournaments Section */}
            {tournaments.filter(
              (tournament) =>
                tournament.status === "active" ||
                tournament.status === "upcoming"
            ).length > 0 && (
              <div className="mt-8 sm:mt-12">
                <div className="flex items-center gap-3 mb-4 sm:mb-6">
                  <div className="relative p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/30 shadow-sm">
                    <Trophy className="w-5 h-5 text-primary" />
                  </div>
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-foreground to-foreground/80">
                    Active Tournaments
                  </h2>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:gap-6 mt-4 sm:mt-6 md:grid-cols-2 lg:grid-cols-3">
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
                        className="transition-all hover:scale-[1.02] hover:shadow-lg"
                      >
                        <Card className="overflow-hidden h-full border-2 border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 hover:border-primary/40 hover:shadow-xl transition-all">
                          <div className="flex flex-col p-4 sm:p-6 h-full">
                            {/* Tournament Header */}
                            <div className="flex justify-between items-start mb-3">
                              <h3 className="text-lg sm:text-xl font-bold pr-2">
                                {tournament.name}
                              </h3>
                              <Badge 
                                variant="outline" 
                                className={`shrink-0 ${
                                  tournament.status === "active"
                                    ? "bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400"
                                    : tournament.status === "upcoming"
                                    ? "bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400"
                                    : "bg-muted/50"
                                }`}
                              >
                                {tournament.status === "upcoming"
                                  ? "UPCOMING"
                                  : tournament.status === "active"
                                  ? "LIVE"
                                  : "COMPLETED"}
                              </Badge>
                            </div>

                            {/* Tournament Format & Description */}
                            <div className="mb-4">
                              <Badge variant="secondary" className="mb-2 text-xs">
                                {tournament.format === "single_elimination"
                                  ? "Single Elimination"
                                  : "Double Elimination"}
                              </Badge>
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {tournament.description ||
                                  "Our first tournament!"}
                              </p>
                            </div>

                            {/* Tournament Details Grid */}
                            <div className="grid grid-cols-2 gap-3 mt-auto pt-4 border-t border-border/50">
                              <div className="flex gap-2 items-center text-xs sm:text-sm">
                                <Calendar className="w-4 h-4 text-primary shrink-0" />
                                <span className="truncate">{formatDate(tournament.startDate)}</span>
                              </div>
                              <div className="flex gap-2 items-center text-xs sm:text-sm">
                                <Users className="w-4 h-4 text-primary shrink-0" />
                                <span className="truncate">
                                  {tournament.registeredTeams?.length || 0}/
                                  {tournament.maxTeams || 8} teams
                                </span>
                              </div>
                            </div>
                          </div>
                        </Card>
                      </Link>
                    ))}
                </div>
              </div>
            )}

            {/* My Team Section */}
            {userTeam && (
              <>
                <div className="mb-8 sm:mb-10 mt-8 sm:mt-12">
                  <div className="flex items-center gap-3 mb-4 sm:mb-6">
                    <div className="relative p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/30 shadow-sm">
                      <Star className="w-5 h-5 text-primary" />
                    </div>
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-foreground to-foreground/80">
                      My Team
                    </h2>
                  </div>
                  <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                    <TeamCard
                      key={userTeam._id}
                      _id={userTeam._id}
                      name={userTeam.name}
                      description={userTeam.description}
                      tag={userTeam.tag}
                      members={userTeam.members}
                      wins={userTeam.wins || 0}
                      losses={userTeam.losses || 0}
                      tournamentWins={userTeam.tournamentWins || 0}
                      userTeam={userTeam}
                      isUserTeam={true}
                      teamElo={userTeam.teamElo}
                    />

                    <Card className="border-2 border-dashed bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/30 hover:border-primary/50 hover:shadow-lg transition-all">
                      <CardContent className="flex flex-col justify-center items-center py-6 sm:py-8 h-full">
                        <div className="relative p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 border-2 border-primary/30 shadow-sm mb-4">
                          <Shield className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
                        </div>
                        <h3 className="mb-2 text-base sm:text-lg font-semibold">
                          Team Management
                        </h3>
                        <p className="mb-4 text-xs sm:text-sm text-center text-muted-foreground px-4">
                          Manage your team roster and invites
                        </p>
                        <Button asChild className="w-full sm:w-auto">
                          <Link
                            href={`/tournaments/teams/${userTeam._id.toString()}`}
                          >
                            <Shield className="mr-2 w-4 h-4" />
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
            <div className="mt-8 sm:mt-12">
              <div className="flex flex-col gap-4 justify-between mb-6 sm:mb-8 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3">
                  <div className="relative p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/30 shadow-sm">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-foreground to-foreground/80">
                      All Teams
                    </h2>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                      Browse or search for teams
                    </p>
                  </div>
                </div>
              </div>

              {/* Filters Section */}
              <Card className="border-2 mb-6 bg-gradient-to-br from-card via-card to-primary/5">
                <CardHeader className="pb-4 border-b border-border/50">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="relative p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/30">
                        <Filter className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base sm:text-lg">Filters</CardTitle>
                        <CardDescription className="text-xs sm:text-sm mt-0.5">
                          Narrow down teams based on tournaments and stats
                        </CardDescription>
                      </div>
                    </div>
                    {(selectedTournament !== "all" || teamStatus !== "all") && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedTournament("all");
                          setTeamStatus("all");
                        }}
                        className="h-9 gap-2 text-xs sm:text-sm"
                      >
                        <X className="w-3.5 h-3.5" />
                        Clear Filters
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-3">
                      <label className="text-sm font-semibold flex items-center gap-2">
                        <div className="relative p-1.5 rounded-md bg-primary/10 border border-primary/20">
                          <Trophy className="w-3.5 h-3.5 text-primary" />
                        </div>
                        Tournament
                        {selectedTournament !== "all" && (
                          <Badge variant="secondary" className="ml-auto text-xs">
                            Active
                          </Badge>
                        )}
                      </label>
                      <Select
                        value={selectedTournament}
                        onValueChange={setSelectedTournament}
                      >
                        <SelectTrigger className="h-11 border-2 focus:border-primary/50 transition-colors">
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

                    <div className="space-y-3">
                      <label className="text-sm font-semibold flex items-center gap-2">
                        <div className="relative p-1.5 rounded-md bg-primary/10 border border-primary/20">
                          <Users className="w-3.5 h-3.5 text-primary" />
                        </div>
                        Team Status
                        {teamStatus !== "all" && (
                          <Badge variant="secondary" className="ml-auto text-xs">
                            Active
                          </Badge>
                        )}
                      </label>
                      <RadioGroup
                        value={teamStatus}
                        onValueChange={(value) =>
                          setTeamStatus(value as "all" | "full" | "open")
                        }
                        className="flex flex-col gap-3"
                      >
                        <div className={`flex items-center space-x-3 p-3 rounded-lg border-2 transition-all cursor-pointer group ${
                          teamStatus === "all" 
                            ? "border-primary/40 bg-primary/10 shadow-sm" 
                            : "border-transparent hover:border-primary/20 hover:bg-primary/5"
                        }`}>
                          <RadioGroupItem value="all" id="all-teams" />
                          <label htmlFor="all-teams" className="text-sm cursor-pointer flex-1 font-medium">
                            All Teams
                          </label>
                        </div>
                        <div className={`flex items-center space-x-3 p-3 rounded-lg border-2 transition-all cursor-pointer group ${
                          teamStatus === "full" 
                            ? "border-primary/40 bg-primary/10 shadow-sm" 
                            : "border-transparent hover:border-primary/20 hover:bg-primary/5"
                        }`}>
                          <RadioGroupItem value="full" id="full-teams" />
                          <label htmlFor="full-teams" className="text-sm cursor-pointer flex-1 font-medium">
                            Full Teams (4+ members)
                          </label>
                        </div>
                        <div className={`flex items-center space-x-3 p-3 rounded-lg border-2 transition-all cursor-pointer group ${
                          teamStatus === "open" 
                            ? "border-primary/40 bg-primary/10 shadow-sm" 
                            : "border-transparent hover:border-primary/20 hover:bg-primary/5"
                        }`}>
                          <RadioGroupItem value="open" id="open-teams" />
                          <label htmlFor="open-teams" className="text-sm cursor-pointer flex-1 font-medium">
                            Teams Looking for Members
                          </label>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Main content section with fixed Tabs structure */}
              <Tabs value={view} onValueChange={setView}>
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center mb-6">
                  <div className="flex gap-2 items-center">
                    <Badge variant="secondary" className="text-xs sm:text-sm">
                      {filteredTeams.length} {filteredTeams.length === 1 ? 'team' : 'teams'} found
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm text-muted-foreground hidden sm:inline">View:</span>
                    <TabsList className="h-10 sm:h-10 w-full sm:w-auto">
                      <TabsTrigger value="grid" className="flex-1 sm:flex-none px-4 sm:px-4 h-10 text-xs sm:text-sm">
                        Grid
                      </TabsTrigger>
                      <TabsTrigger value="list" className="flex-1 sm:flex-none px-4 sm:px-4 h-10 text-xs sm:text-sm">
                        List
                      </TabsTrigger>
                    </TabsList>
                  </div>
                </div>

                {loading ? (
                  <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Card key={i} className="overflow-hidden border-2">
                        <CardHeader className="p-4 sm:p-6">
                          <Skeleton className="w-36 h-6" />
                          <Skeleton className="mt-2 w-24 h-4" />
                        </CardHeader>
                        <CardContent className="p-4 sm:p-6 pt-0">
                          <Skeleton className="w-full h-16" />
                          <div className="grid grid-cols-2 gap-2 mt-4">
                            <Skeleton className="w-full h-12" />
                            <Skeleton className="w-full h-12" />
                          </div>
                        </CardContent>
                        <CardFooter className="border-t p-4 sm:p-6">
                          <div className="flex gap-2 justify-end w-full">
                            <Skeleton className="w-20 sm:w-24 h-8 sm:h-9" />
                            <Skeleton className="w-20 sm:w-24 h-8 sm:h-9" />
                          </div>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                ) : filteredTeams.length > 0 ? (
                  <>
                    <TabsContent value="grid" className="mt-0">
                      <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {currentTeams.map((team) => (
                          <TeamCard
                            key={team._id}
                            _id={team._id}
                            name={team.name}
                            tag={team.tag}
                            description={team.description}
                            members={team.members}
                            wins={team.wins || 0}
                            losses={team.losses || 0}
                            tournamentWins={team.tournamentWins || 0}
                            userTeam={userTeam}
                            isUserTeam={userTeam?._id === team._id}
                            teamElo={team.teamElo}
                          />
                        ))}
                      </div>
                    </TabsContent>

                    <TabsContent value="list" className="mt-0">
                      <div className="overflow-x-auto rounded-lg border-2">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-gradient-to-r from-muted/80 via-muted/60 to-muted/80 border-b-2 border-border">
                              <th className="p-3 sm:p-4 text-left text-xs sm:text-sm font-semibold">Team</th>
                              <th className="p-3 sm:p-4 text-left text-xs sm:text-sm font-semibold hidden sm:table-cell">Captain</th>
                              <th className="p-3 sm:p-4 text-left text-xs sm:text-sm font-semibold">Members</th>
                              <th className="p-3 sm:p-4 text-left text-xs sm:text-sm font-semibold hidden md:table-cell">ELO</th>
                              <th className="p-3 sm:p-4 text-right text-xs sm:text-sm font-semibold">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {currentTeams.map((team) => (
                              <tr
                                key={team._id}
                                className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                              >
                                <td className="p-3 sm:p-4">
                                  <div className="font-semibold text-sm sm:text-base">{team.name}</div>
                                  <div className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                                    [{team.tag}]
                                  </div>
                                  <div className="text-xs text-muted-foreground mt-1 sm:hidden">
                                    {team.members.find(
                                      (m) =>
                                        m.role === "captain" ||
                                        m.discordId === team.captain?.discordId
                                    )?.discordNickname ||
                                      team.captain?.discordNickname ||
                                      "Stock Captain"}
                                  </div>
                                  <div className="text-xs text-muted-foreground mt-0.5 md:hidden">
                                    ELO: {team.teamElo?.toLocaleString() || "N/A"}
                                  </div>
                                </td>
                                <td className="p-3 sm:p-4 hidden sm:table-cell">
                                  <div className="text-sm">
                                    {team.members.find(
                                      (m) =>
                                        m.role === "captain" ||
                                        m.discordId === team.captain?.discordId
                                    )?.discordNickname ||
                                      team.captain?.discordNickname ||
                                      "Stock Captain"}
                                  </div>
                                </td>
                                <td className="p-3 sm:p-4">
                                  <div className="flex items-center gap-1.5">
                                    <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                                    <span className="text-sm sm:text-base font-medium">
                                      {team.members?.length || 0}
                                    </span>
                                  </div>
                                </td>
                                <td className="p-3 sm:p-4 hidden md:table-cell">
                                  <div className="flex items-center gap-1.5">
                                    <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                                    <span className="text-sm sm:text-base font-medium">
                                      {team.teamElo?.toLocaleString() || "N/A"}
                                    </span>
                                  </div>
                                </td>
                                <td className="p-3 sm:p-4">
                                  <div className="flex flex-col sm:flex-row gap-2 justify-end items-stretch sm:items-center">
                                    <Button variant="outline" size="sm" asChild className="h-9 sm:h-10 text-xs sm:text-sm">
                                      <Link
                                        href={`/tournaments/teams/${team.tag}`}
                                      >
                                        View
                                      </Link>
                                    </Button>
                                    {userTeam &&
                                      team._id !== userTeam._id &&
                                      session?.user?.id ===
                                        userTeam?.captain?.discordId && (
                                        <ChallengeTeamDialog
                                          team={{
                                            _id: team._id,
                                            name: team.name,
                                            tag: team.tag,
                                            captain: team.captain,
                                            members: team.members,
                                          }}
                                          userTeam={userTeam}
                                          disabled={team.members.length < 4}
                                        />
                                      )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </TabsContent>

                    {/* Pagination UI */}
                    {totalPages > 1 && (
                      <Card className="border-2 mt-6 sm:mt-8">
                        <CardContent className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center p-4 sm:p-6">
                          <div className="text-xs sm:text-sm text-muted-foreground">
                            Showing <span className="font-medium text-foreground">{indexOfFirstTeam + 1}</span> to{" "}
                            <span className="font-medium text-foreground">{Math.min(indexOfLastTeam, filteredTeams.length)}</span> of{" "}
                            <span className="font-medium text-foreground">{filteredTeams.length}</span> teams
                          </div>
                          <div className="flex flex-wrap gap-2 justify-center sm:justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePageChange(1)}
                              disabled={currentPage === 1}
                              className="h-9 sm:h-10 px-3 sm:px-4 text-xs sm:text-sm"
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
                              className="h-9 sm:h-10 px-3 sm:px-4"
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <div className="flex items-center px-3 sm:px-4 h-9 sm:h-10 text-xs sm:text-sm rounded-md border-2 bg-background border-input font-medium">
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
                              className="h-9 sm:h-10 px-3 sm:px-4"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePageChange(totalPages)}
                              disabled={currentPage === totalPages}
                              className="h-9 sm:h-10 px-3 sm:px-4 text-xs sm:text-sm"
                            >
                              Last
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </>
                ) : (
                  <Card className="border-2 border-dashed">
                    <CardContent className="flex justify-center items-center p-8 sm:p-12">
                      <div className="text-center max-w-md">
                        <div className="relative mx-auto mb-4 w-16 h-16 sm:w-20 sm:h-20 p-4 rounded-full bg-gradient-to-br from-muted to-muted/50 border-2 border-border/50">
                          <Users className="w-8 h-8 sm:w-10 sm:h-10 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg sm:text-xl font-semibold mb-2">No Teams Found</h3>
                        <p className="mt-1 text-sm sm:text-base text-muted-foreground mb-6">
                          {searchQuery
                            ? `No teams match "${searchQuery}"`
                            : selectedTournament !== "all"
                            ? "No teams found for this tournament"
                            : "Create the first team to get started!"}
                        </p>
                        {!searchQuery && selectedTournament === "all" && (
                          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                            <SheetTrigger asChild>
                              <Button className="h-10 sm:h-11 px-4 sm:px-6">
                                <Plus className="mr-2 w-4 h-4" />
                                Create a Team
                              </Button>
                            </SheetTrigger>
                            <SheetContent className="w-full sm:max-w-lg overflow-y-auto px-4 sm:px-6 py-4 sm:py-6">
                              <CreateTeamForm
                                isSheet={true}
                                onSuccess={() => {
                                  fetchTeams();
                                  setSheetOpen(false);
                                }}
                                onClose={() => {
                                  setSheetOpen(false);
                                }}
                              />
                            </SheetContent>
                          </Sheet>
                        )}
                      </div>
                    </CardContent>
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
