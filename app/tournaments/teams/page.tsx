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

                      <div className="grid gap-2">
                        <label className="text-sm font-medium">
                          Team Status
                        </label>
                        <RadioGroup
                          value={teamStatus}
                          onValueChange={(value) =>
                            setTeamStatus(value as "all" | "full" | "open")
                          }
                          className="flex flex-col space-y-1"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="all" id="all-teams" />
                            <label htmlFor="all-teams" className="text-sm">
                              All Teams
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="full" id="full-teams" />
                            <label htmlFor="full-teams" className="text-sm">
                              Full Teams (4+ members)
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="open" id="open-teams" />
                            <label htmlFor="open-teams" className="text-sm">
                              Teams Looking for Members
                            </label>
                          </div>
                        </RadioGroup>
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
                        <Card className="overflow-hidden h-full border-t-4 border-t-primary">
                          <div className="flex flex-col p-6 h-full">
                            {/* Tournament Header */}
                            <div className="flex justify-between items-start mb-2">
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
                              <div className="flex gap-2 items-center text-sm">
                                <Calendar className="w-4 h-4 text-muted-foreground" />
                                <span>{formatDate(tournament.startDate)}</span>
                              </div>
                              <div className="flex gap-2 items-center text-sm">
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
                </div>
              </div>
            )}

            {/* My Team Section */}
            {userTeam && (
              <>
                <div className="mb-8">
                  <h2 className="mt-8 mb-4 text-xl font-semibold">My Team</h2>
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
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

                    <Card className="border-dashed bg-primary/5 border-primary/30">
                      <CardContent className="flex flex-col justify-center items-center py-8 h-full">
                        <h3 className="mb-2 text-lg font-medium">
                          Team Management
                        </h3>
                        <p className="mb-4 text-sm text-center text-muted-foreground">
                          Manage your team roster and invites
                        </p>
                        <Button asChild>
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
            <div className="mt-8">
              <div className="flex flex-col gap-4 justify-between mb-6 sm:flex-row sm:items-center">
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

                        <div className="grid gap-2">
                          <label className="text-sm font-medium">
                            Team Status
                          </label>
                          <RadioGroup
                            value={teamStatus}
                            onValueChange={(value) =>
                              setTeamStatus(value as "all" | "full" | "open")
                            }
                            className="flex flex-col space-y-1"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="all" id="all-teams-2" />
                              <label htmlFor="all-teams-2" className="text-sm">
                                All Teams
                              </label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="full" id="full-teams-2" />
                              <label htmlFor="full-teams-2" className="text-sm">
                                Full Teams (4+ members)
                              </label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="open" id="open-teams-2" />
                              <label htmlFor="open-teams-2" className="text-sm">
                                Teams Looking for Members
                              </label>
                            </div>
                          </RadioGroup>
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
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Main content section with fixed Tabs structure */}
              <Tabs value={view} onValueChange={setView}>
                <div className="flex justify-between mb-6">
                  <div className="flex gap-2 items-center">
                    <p className="text-sm text-muted-foreground">
                      {filteredTeams.length} teams found
                    </p>
                  </div>
                  <TabsList className="h-8">
                    <TabsTrigger value="grid" className="px-3 h-8">
                      Grid
                    </TabsTrigger>
                    <TabsTrigger value="list" className="px-3 h-8">
                      List
                    </TabsTrigger>
                  </TabsList>
                </div>

                {loading ? (
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Card key={i} className="overflow-hidden">
                        <CardHeader>
                          <Skeleton className="w-36 h-6" />
                          <Skeleton className="mt-1 w-24 h-4" />
                        </CardHeader>
                        <CardContent>
                          <Skeleton className="w-full h-16" />
                          <div className="grid grid-cols-2 gap-2 mt-4">
                            <Skeleton className="w-full h-12" />
                            <Skeleton className="w-full h-12" />
                          </div>
                        </CardContent>
                        <CardFooter className="border-t">
                          <div className="flex gap-2 justify-end w-full">
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

                    <TabsContent value="list">
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-muted/50">
                              <th className="p-3 text-left">Team</th>
                              <th className="p-3 text-left">Captain</th>
                              <th className="p-3 text-left">Members</th>
                              <th className="p-3 text-left">ELO</th>
                              <th className="p-3 text-right"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {currentTeams.map((team) => (
                              <tr
                                key={team._id}
                                className="border-b border-muted hover:bg-muted/30"
                              >
                                <td className="p-3">
                                  <div className="font-medium">{team.name}</div>
                                  <div className="text-sm text-muted-foreground">
                                    [{team.tag}]
                                  </div>
                                </td>
                                <td className="p-3">
                                  {team.members.find(
                                    (m) =>
                                      m.role === "captain" ||
                                      m.discordId === team.captain?.discordId
                                  )?.discordNickname ||
                                    team.captain?.discordNickname ||
                                    "Stock Captain"}
                                </td>
                                <td className="p-3">
                                  {team.members?.length || 0}
                                </td>
                                <td className="p-3">
                                  {team.teamElo?.toLocaleString() || "N/A"}
                                </td>
                                <td className="p-3 space-x-2 text-right">
                                  <Button variant="outline" size="sm" asChild>
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
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </TabsContent>

                    {/* Pagination UI */}
                    {totalPages > 1 && (
                      <div className="flex justify-between items-center p-4 mt-6 rounded-md border bg-card">
                        <div className="text-sm text-muted-foreground">
                          Showing {indexOfFirstTeam + 1} to{" "}
                          {Math.min(indexOfLastTeam, filteredTeams.length)} of{" "}
                          {filteredTeams.length} teams
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(1)}
                            disabled={currentPage === 1}
                            className="px-3 h-8"
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
                            className="px-3 h-8"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </Button>
                          <div className="flex items-center px-3 h-8 text-sm rounded-md border bg-background border-input">
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
                            className="px-3 h-8"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(totalPages)}
                            disabled={currentPage === totalPages}
                            className="px-3 h-8"
                          >
                            Last
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <Card className="flex justify-center items-center p-8">
                    <div className="text-center">
                      <Users className="mx-auto mb-3 w-8 h-8 text-muted-foreground" />
                      <h3 className="text-lg font-medium">No Teams Found</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {searchQuery
                          ? `No teams match "${searchQuery}"`
                          : selectedTournament !== "all"
                          ? "No teams found for this tournament"
                          : "Create the first team to get started!"}
                      </p>
                      <Sheet>
                        <SheetTrigger asChild>
                          <Button className="mt-4">
                            <Plus className="mr-2 w-4 h-4" />
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
