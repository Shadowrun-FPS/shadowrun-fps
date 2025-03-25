"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Trophy,
  Users,
  Clock,
  Shuffle,
  ChevronDown,
  HelpCircle,
  X,
  Play,
  Loader2,
  RotateCcw,
  UserCircle,
} from "lucide-react";
import { useSession } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TournamentBracket } from "@/components/tournament/bracket";
import { toast } from "@/components/ui/use-toast";
import Image from "next/image";
import { EditTournamentDialog } from "@/components/tournaments/edit-tournament-dialog";

// Types
interface Tournament {
  _id: string;
  name: string;
  description?: string;
  startDate: string;
  teamSize: number;
  format: "single_elimination" | "double_elimination";
  status: "upcoming" | "active" | "completed";
  registeredTeams: Team[];
  brackets: {
    rounds: Round[];
    losersRounds?: Round[]; // For double elimination
  };
  maxTeams?: number;
}

interface Team {
  _id: string;
  name: string;
  tag: string;
  teamElo?: number;
  createdAt?: string;
  members?: {
    discordId: string;
    discordUsername: string;
    discordNickname: string | null;
    discordProfilePicture: string | null;
    elo: number;
    role?: string;
  }[];
  captain?: {
    discordId: string;
    discordUsername: string;
    discordNickname: string | null;
    discordProfilePicture: string | null;
    elo: number;
  };
}

interface Round {
  name: string;
  matches: Match[];
}

interface Match {
  matchId: string;
  teamA?: Team;
  teamB?: Team;
  scores: {
    teamA: number;
    teamB: number;
  };
  winner?: "teamA" | "teamB" | "draw";
  status: "upcoming" | "live" | "completed";
}

// Add type definition for the MemberAvatar props
interface MemberAvatarProps {
  profilePicture: string | null;
  username: string | null | undefined;
  size: number;
}

// First, add a custom avatar component for reuse
const MemberAvatar = ({
  profilePicture,
  username,
  size,
}: MemberAvatarProps) => {
  const [imgError, setImgError] = useState(false);

  return imgError || !profilePicture ? (
    <UserCircle className={`w-${size} h-${size} text-muted-foreground`} />
  ) : (
    <Image
      src={profilePicture}
      alt={username || "Member"}
      width={size * 4}
      height={size * 4}
      className="transition-colors border rounded-full border-border hover:border-primary"
      onError={() => setImgError(true)}
    />
  );
};

export default function TournamentDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("bracket");
  const [currentRound, setCurrentRound] = useState(0);
  const [currentBracket, setCurrentBracket] = useState<"winners" | "losers">(
    "winners"
  );
  const { data: session } = useSession();
  const [userTeams, setUserTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [isRegisterDialogOpen, setIsRegisterDialogOpen] = useState(false);
  const [isUnregisterDialogOpen, setIsUnregisterDialogOpen] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [unregistering, setUnregistering] = useState(false);
  const [unregisterError, setUnregisterError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [isSeeded, setIsSeeded] = useState(false);
  const [unseeding, setUnseeding] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [isLoadingAction, setIsLoadingAction] = useState(false);
  const [hasSeededTeams, setHasSeededTeams] = useState(false);
  const [tournamentStarted, setTournamentStarted] = useState(false);

  const fetchTournament = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        `/api/tournaments/${params.id}?t=${Date.now()}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch tournament data");
      }

      const data = await response.json();
      setTournament(data);

      // Set current round to the latest active round
      if (data.brackets?.rounds) {
        const activeRoundIndex = Math.max(
          0,
          data.brackets.rounds.findIndex(
            (round: { matches: { status: string }[] }) =>
              round.matches.some(
                (match: { status: string }) => match.status === "live"
              )
          )
        );
        setCurrentRound(activeRoundIndex);
      }

      // Ensure there's always a bracket structure
      const ensureBracketStructure = (tournament: Tournament) => {
        if (
          !tournament.brackets ||
          !tournament.brackets.rounds ||
          tournament.brackets.rounds.length === 0
        ) {
          // Create default bracket structure
          const roundCount = Math.ceil(Math.log2(tournament.maxTeams || 8));
          const rounds = [];

          for (let i = 0; i < roundCount; i++) {
            const matchCount = Math.pow(2, roundCount - i - 1);
            const matches = Array(matchCount)
              .fill(0)
              .map((_, j) => ({
                matchId: `r${i + 1}_m${j + 1}`,
                scores: { teamA: 0, teamB: 0 },
                status: "upcoming" as "upcoming" | "live" | "completed",
              }));

            rounds.push({
              name: i === roundCount - 1 ? "Final" : `Round ${i + 1}`,
              matches,
            });
          }

          tournament.brackets = { rounds };
        }

        return tournament;
      };

      ensureBracketStructure(data);

      // Check if teams have already been seeded
      setHasSeededTeams(
        data.brackets?.rounds?.[0]?.matches?.some(
          (match: any) => match.teamA || match.teamB
        ) || false
      );

      // Check if tournament is already started
      setTournamentStarted(
        data.status === "in_progress" || data.status === "active"
      );
    } catch (error) {
      console.error("Error fetching tournament data:", error);
      setError("Failed to load tournament");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params.id) {
      fetchTournament();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  useEffect(() => {
    const fetchUserTeams = async () => {
      if (!session?.user?.id) return;

      try {
        const response = await fetch(`/api/users/teams`);
        if (response.ok) {
          const data = await response.json();
          setUserTeams(data.teams || []);
          if (data.teams?.length > 0) {
            setSelectedTeamId(data.teams[0]._id);
          }
        }
      } catch (error) {
        console.error("Error fetching user teams:", error);
      }
    };

    if (session) {
      fetchUserTeams();
    }
  }, [session]);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (session?.user?.id) {
        // Allow your specific ID to be admin for testing
        if (session.user.id === "238329746671271936") {
          setIsAdmin(true);
          return;
        }

        try {
          const response = await fetch("/api/user/status");
          if (response.ok) {
            const data = await response.json();
            setIsAdmin(data.roles?.includes("admin") || false);
          }
        } catch (error) {
          console.error("Error checking admin status:", error);
        }
      }
    };

    checkAdminStatus();
  }, [session]);

  useEffect(() => {
    if (tournament) {
      // Determine if tournament is seeded by checking if any bracket matches have teams assigned
      const hasSeededTeams = tournament.brackets?.rounds?.[0]?.matches?.some(
        (match: any) => match.teamA || match.teamB
      );
      setIsSeeded(!!hasSeededTeams);
    }
  }, [tournament]);

  const userCaptainedTeams = useMemo(() => {
    if (!tournament?.registeredTeams || !session?.user?.id) return [];

    return tournament.registeredTeams.filter(
      (team) => team.captain?.discordId === session.user.id
    );
  }, [tournament?.registeredTeams, session?.user?.id]);

  const registerTeam = async () => {
    if (!selectedTeamId) return;

    setRegistering(true);
    setRegisterError(null);

    try {
      const response = await fetch(`/api/tournaments/${params.id}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId: selectedTeamId }),
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Registration endpoint not found");
        }

        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to register team");
      }

      // Refresh tournament data
      await fetchTournament();
      setIsRegisterDialogOpen(false);
    } catch (error) {
      console.error("Error registering team:", error);
      setRegisterError(
        error instanceof Error ? error.message : "An unexpected error occurred"
      );
    } finally {
      setRegistering(false);
    }
  };

  const unregisterTeam = async (teamId: string) => {
    try {
      setUnregistering(true);
      setUnregisterError(null);

      const response = await fetch(`/api/tournaments/${params.id}/unregister`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ teamId }),
      });

      if (response.ok) {
        setIsUnregisterDialogOpen(false);
        toast({
          title: "Team unregistered",
          description: "Your team has been unregistered from the tournament.",
        });

        // Force a full refresh of tournament data
        await fetchTournament();

        // Force reload the page to ensure all state is reset
        window.location.reload();
      } else {
        const data = await response.json();
        setUnregisterError(data.error || "Failed to unregister team");
      }
    } catch (error) {
      console.error("Error unregistering team:", error);
      setUnregisterError("An unexpected error occurred");
    } finally {
      setUnregistering(false);
    }
  };

  const canRegister =
    userTeams.length > 0 &&
    tournament?.status === "upcoming" &&
    tournament?.registeredTeams.length < (tournament?.maxTeams || 8);

  const isTeamRegistered = (teamId: string) => {
    return (
      tournament?.registeredTeams?.some((team) => team._id === teamId) || false
    );
  };

  const handlePreseed = async () => {
    if (!tournament?._id) return;

    try {
      setSeeding(true);
      const response = await fetch(
        `/api/tournaments/${tournament._id}/preseed`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to pre-seed tournament");
      }

      // Refresh tournament data
      await fetchTournament();
    } catch (error) {
      console.error("Error pre-seeding tournament:", error);
    } finally {
      setSeeding(false);
    }
  };

  const handleFillTournament = async () => {
    if (!tournament?._id) return;

    try {
      const response = await fetch(`/api/tournaments/${tournament._id}/fill`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to fill tournament");
      }

      // Refresh tournament data
      await fetchTournament();
    } catch (error) {
      console.error("Error filling tournament:", error);
    }
  };

  const handleClearTournament = async () => {
    try {
      const response = await fetch(`/api/tournaments/${params.id}/clear`, {
        method: "POST",
      });

      const responseData = await response.json();

      if (!response.ok) {
        const errorMessage = responseData.error || "Failed to clear tournament";
        console.error("Clear tournament error details:", responseData);
        throw new Error(errorMessage);
      }

      toast({
        title: "Success",
        description: "Tournament teams cleared",
      });

      await fetchTournament();
    } catch (error) {
      console.error("Error clearing tournament:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to clear tournament",
        variant: "destructive",
      });
    }
  };

  const totalRounds = tournament?.brackets?.rounds?.length || 0;
  const currentRoundName =
    tournament?.brackets?.rounds?.[currentRound]?.name ||
    `Round ${currentRound + 1}`;

  const goToPreviousRound = () => {
    if (currentRound > 0) {
      setCurrentRound(currentRound - 1);
    }
  };

  const goToNextRound = () => {
    if (currentRound < totalRounds - 1) {
      setCurrentRound(currentRound + 1);
    }
  };

  const handleLaunchTournament = async () => {
    if (!isAdmin) return;

    try {
      setLaunching(true);
      const response = await fetch(`/api/tournaments/${params.id}/launch`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to launch tournament");
      }

      toast({
        title: "Tournament Launched",
        description: "The tournament has been successfully launched",
      });

      await fetchTournament();
    } catch (error) {
      console.error("Error launching tournament:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to launch tournament",
        variant: "destructive",
      });
    } finally {
      setLaunching(false);
    }
  };

  const handleUndoSeeding = async () => {
    try {
      setIsLoadingAction(true);

      const response = await fetch(
        `/api/tournaments/${tournament?._id}/undo-seeding`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to undo seeding");
      }

      // Refresh the tournament data
      await fetchTournament();
      setHasSeededTeams(false);

      toast({
        title: "Seeding removed",
        description: "Teams have been unseeded successfully",
      });
    } catch (error) {
      console.error("Failed to undo seeding:", error);
      toast({
        title: "Error",
        description: "Failed to undo team seeding",
        variant: "destructive",
      });
    } finally {
      setIsLoadingAction(false);
    }
  };

  const handleEditSuccess = (updatedTournament: Tournament) => {
    setTournament(updatedTournament);
    toast({
      title: "Success",
      description: "Tournament updated successfully",
    });
  };

  const resetTournament = async () => {
    try {
      setIsLoadingAction(true);

      // Check if user is admin or has the specific Discord ID
      const isAuthorized =
        isAdmin || session?.user?.id === "238329746671271936";

      if (!isAuthorized) {
        toast({
          title: "Permission Denied",
          description: "You don't have permission to reset this tournament.",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch(`/api/tournaments/${params.id}/reset`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to reset tournament");
      }

      // Refresh the tournament data
      await fetchTournament();

      toast({
        title: "Tournament Reset",
        description: "The tournament has been reset to upcoming status.",
      });

      // Close the confirmation dialog
      setResetConfirmOpen(false);
    } catch (error) {
      console.error("Error resetting tournament:", error);
      toast({
        title: "Error",
        description: "Failed to reset the tournament. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingAction(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-8 mx-auto">
        <div className="w-full h-64 rounded-lg bg-gray-800/50 animate-pulse"></div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="container py-8 mx-auto">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <HelpCircle className="w-12 h-12 mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold">Tournament Not Found</h2>
            <p className="mt-2 text-muted-foreground">
              The tournament you&apos;re looking for doesn&apos;t exist or has
              been removed.
            </p>
            <Button className="mt-6" asChild>
              <Link href="/tournaments">View All Tournaments</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const rounds =
    currentBracket === "winners"
      ? tournament.brackets.rounds
      : tournament.brackets.losersRounds || [];

  const currentRoundData = rounds[currentRound] || {
    name: "Round 1",
    matches: [],
  };

  const hasPreviousRound = currentRound > 0;
  const hasNextRound = currentRound < rounds.length - 1;

  // Find featured match (first match with live status, or first match if none are live)
  const featuredMatch =
    tournament.brackets.rounds
      .flatMap((round) => round.matches)
      .find((match) => match.status === "live") ||
    tournament.brackets.rounds[0]?.matches[0] ||
    null;

  const handleRoundChange = (newRound: number) => {
    setCurrentRound(newRound);
  };

  return (
    <div className="min-h-screen">
      <div className="container px-4 py-6 mx-auto">
        {/* Tournament Header */}
        <div className="flex items-center mb-2">
          <Button variant="ghost" size="sm" asChild className="mr-2">
            <Link href="/tournaments">
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">{tournament.name}</h1>
          {isAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditDialogOpen(true)}
              className="ml-auto"
            >
              Edit Tournament
            </Button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-6">
          <Badge variant="outline" className="flex items-center gap-1 text-sm">
            <Calendar className="w-3.5 h-3.5" />
            {format(new Date(tournament.startDate), "MMMM d, yyyy")}
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1 text-sm">
            <Trophy className="w-3.5 h-3.5" />
            {tournament.format === "single_elimination"
              ? "Single Elimination"
              : "Double Elimination"}
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1 text-sm">
            <Users className="w-3.5 h-3.5" />
            {tournament.registeredTeams.length} Teams
          </Badge>
          <Badge
            variant={
              tournament.status === "upcoming"
                ? "secondary"
                : tournament.status === "active"
                ? "default"
                : "outline"
            }
            className="text-sm"
          >
            {tournament.status === "upcoming"
              ? "Upcoming"
              : tournament.status === "active"
              ? "In Progress"
              : "Completed"}
          </Badge>
        </div>

        {/* Tabs Navigation */}
        <Tabs
          defaultValue="bracket"
          value={activeTab}
          onValueChange={setActiveTab}
          className="mb-6"
        >
          <TabsList className="w-full mb-6 bg-transparent border-b rounded-none h-14">
            <TabsTrigger
              value="bracket"
              className="flex-1 h-14 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
            >
              Bracket
            </TabsTrigger>
            <TabsTrigger
              value="standings"
              className="flex-1 h-14 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
            >
              Standings
            </TabsTrigger>
            <TabsTrigger
              value="teams"
              className="flex-1 h-14 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
            >
              Teams
            </TabsTrigger>
          </TabsList>

          {/* Bracket Content */}
          <TabsContent value="bracket">
            {tournament?.registeredTeams?.length < 2 ? (
              <div className="p-8 text-center">
                <div className="mb-4 text-4xl opacity-30">🏆</div>
                <h3 className="mb-2 text-xl font-medium">
                  Not Enough Teams Registered
                </h3>
                <p className="mb-4 text-muted-foreground">
                  At least 2 teams need to be registered before the tournament
                  bracket can be generated.
                </p>
                <div className="text-sm text-muted-foreground">
                  {tournament?.registeredTeams?.length}/
                  {tournament?.maxTeams || 8} teams registered
                </div>
              </div>
            ) : (
              <div className="mt-4">
                <TournamentBracket
                  rounds={tournament?.brackets?.rounds || []}
                  currentRound={currentRound}
                  onPreviousRound={() =>
                    setCurrentRound(Math.max(0, currentRound - 1))
                  }
                  onNextRound={() =>
                    setCurrentRound(
                      Math.min(
                        (tournament?.brackets?.rounds?.length || 1) - 1,
                        currentRound + 1
                      )
                    )
                  }
                />
              </div>
            )}
          </TabsContent>

          {/* Standings Content */}
          <TabsContent value="standings" className="mt-0">
            <Card>
              <CardContent className="p-6">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-800">
                      <th className="pb-2 text-left">Rank</th>
                      <th className="pb-2 text-left">Team</th>
                      <th className="pb-2 text-right">W</th>
                      <th className="pb-2 text-right">L</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tournament.registeredTeams.map((team, index) => (
                      <tr key={team._id} className="border-b border-gray-800">
                        <td className="py-3">{index + 1}</td>
                        <td className="py-3">{team.name}</td>
                        <td className="py-3 text-right text-green-500">0</td>
                        <td className="py-3 text-right text-red-500">0</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Teams Content */}
          <TabsContent value="teams">
            <div className="mt-2 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">
                  Registered Teams
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    {tournament.registeredTeams.length}/
                    {tournament.maxTeams || 8} Teams Registered
                  </span>
                </h2>

                {/* Registration actions */}
                {session?.user && tournament.status === "upcoming" && (
                  <div className="flex gap-2">
                    {isTeamRegistered(selectedTeamId) ? (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setIsUnregisterDialogOpen(true)}
                        disabled={unregistering}
                      >
                        {unregistering ? "Unregistering..." : "Unregister Team"}
                      </Button>
                    ) : (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => setIsRegisterDialogOpen(true)}
                        disabled={
                          registering ||
                          tournament.registeredTeams.length >=
                            (tournament.maxTeams || 8)
                        }
                      >
                        {registering ? "Registering..." : "Register Team"}
                      </Button>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {tournament.registeredTeams.map((team, index) => (
                  <Card
                    key={team._id}
                    className="flex flex-col overflow-hidden"
                  >
                    <CardContent className="flex-1 pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="flex items-center font-semibold">
                            <span className="mr-2 bg-muted px-1.5 py-0.5 rounded-md text-xs">
                              #{index + 1}
                            </span>
                            {team.name}
                            {team.tag && (
                              <span className="ml-1 text-muted-foreground">
                                [{team.tag}]
                              </span>
                            )}
                          </h4>
                        </div>
                        {team.teamElo !== undefined && (
                          <Badge variant="secondary">
                            ELO: {team.teamElo.toLocaleString()}
                          </Badge>
                        )}
                      </div>

                      <div className="space-y-3">
                        {/* Captain Section with fallbacks */}
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Team Captain:</p>
                          {team.captain ? (
                            <div className="flex items-center space-x-2">
                              <MemberAvatar
                                profilePicture={
                                  team.captain.discordProfilePicture
                                }
                                username={team.captain.discordUsername}
                                size={6}
                              />
                              <span>
                                {team.captain.discordNickname ||
                                  team.captain.discordUsername ||
                                  "Unknown"}
                                {team.captain.elo !== undefined && (
                                  <span className="ml-1 text-xs text-muted-foreground"></span>
                                )}
                              </span>
                            </div>
                          ) : (
                            <div className="text-sm text-muted-foreground">
                              No captain information
                            </div>
                          )}
                        </div>

                        {/* Team Members section with row layout and tooltips */}
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Team Members</p>
                          {Array.isArray(team.members) &&
                          team.members.length > 0 ? (
                            <div>
                              {/* Avatars in a row */}
                              <div className="flex flex-wrap gap-2 mb-1">
                                {team.members.map((member) => (
                                  <TooltipProvider key={member.discordId}>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div className="relative">
                                          <MemberAvatar
                                            profilePicture={
                                              member.discordProfilePicture
                                            }
                                            username={member.discordUsername}
                                            size={8}
                                          />
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent
                                        side="bottom"
                                        className="text-xs"
                                      >
                                        <p className="font-medium">
                                          {member.discordNickname ||
                                            member.discordUsername ||
                                            "Unknown"}
                                        </p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm text-muted-foreground">
                              No team members found
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>

                    <div className="flex items-center justify-between px-4 py-2 border-t bg-muted/20">
                      <span className="text-xs text-muted-foreground">
                        {format(
                          new Date(team.createdAt || Date.now()),
                          "MMM d, yyyy"
                        )}
                      </span>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/tournaments/teams/${team._id}`}>
                            View Team
                          </Link>
                        </Button>

                        {/* Admin remove button */}
                        {(team.captain?.discordId === session?.user?.id ||
                          isAdmin) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700 dark:hover:bg-red-900/20"
                            onClick={() => unregisterTeam(team._id)}
                            disabled={unregistering}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}

                {/* Placeholder cards for remaining slots */}
                {tournament.status === "upcoming" &&
                  Array.from({
                    length:
                      (tournament.maxTeams || 8) -
                      tournament.registeredTeams.length,
                  }).map((_, index) => (
                    <Card
                      key={`empty-${index}`}
                      className="bg-transparent border border-dashed"
                    >
                      <div className="flex flex-col items-center justify-center p-6 h-full min-h-[200px] text-muted-foreground">
                        <Users className="w-8 h-8 mb-2 opacity-40" />
                        <p className="text-center">Waiting for team...</p>
                      </div>
                    </Card>
                  ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Tournament Actions */}
        {isAdmin && (
          <div className="mt-6 space-y-4">
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={hasSeededTeams ? handleUndoSeeding : handlePreseed}
                disabled={
                  isLoadingAction || tournament.registeredTeams.length < 2
                }
              >
                {isLoadingAction ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : hasSeededTeams ? (
                  "Undo Seeding"
                ) : (
                  "Pre-Seed Teams"
                )}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleFillTournament}
                disabled={isLoadingAction}
              >
                Fill Tournament
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleClearTournament}
                disabled={isLoadingAction}
              >
                Clear Teams
              </Button>

              {/* Conditional rendering for Start/Reset Tournament button */}
              {tournamentStarted ? (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setResetConfirmOpen(true)}
                  disabled={isLoadingAction}
                >
                  Reset Tournament
                </Button>
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleLaunchTournament}
                  disabled={
                    isLoadingAction ||
                    tournament.registeredTeams.length < 2 ||
                    tournament.status === "completed"
                  }
                >
                  {isLoadingAction ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Start Tournament
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* Note about the reset functionality when tournament is active */}
            {tournament.status === "active" && (
              <p className="text-sm text-muted-foreground">
                Resetting the tournament will change its status back to
                &quot;upcoming&quot; and allow teams to register again, but will
                preserve existing registrations.
              </p>
            )}
          </div>
        )}

        {/* Team Registration Dialog */}
        <Dialog
          open={isRegisterDialogOpen}
          onOpenChange={setIsRegisterDialogOpen}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Register Team</DialogTitle>
              <DialogDescription>
                Select a team to register for this tournament.
              </DialogDescription>
            </DialogHeader>

            {userTeams.length > 0 ? (
              <>
                <div className="py-4 space-y-4">
                  <Select
                    value={selectedTeamId}
                    onValueChange={setSelectedTeamId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a team" />
                    </SelectTrigger>
                    <SelectContent>
                      {userTeams.map((team) => (
                        <SelectItem
                          key={team._id}
                          value={team._id}
                          disabled={isTeamRegistered(team._id)}
                        >
                          {team.name}{" "}
                          {isTeamRegistered(team._id) && "(Already registered)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {registerError && (
                    <div className="text-sm font-medium text-red-500">
                      {registerError}
                    </div>
                  )}
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsRegisterDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={registerTeam}
                    disabled={
                      registering ||
                      !selectedTeamId ||
                      isTeamRegistered(selectedTeamId)
                    }
                  >
                    {registering ? "Registering..." : "Register Team"}
                  </Button>
                </DialogFooter>
              </>
            ) : (
              <div className="py-6 text-center">
                <p className="text-muted-foreground">
                  You don&apos;t have any teams that you captain.
                </p>
                <Button asChild className="mt-4">
                  <Link href="/teams/create">Create a Team</Link>
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Unregister Team Dialog */}
        <Dialog
          open={isUnregisterDialogOpen}
          onOpenChange={setIsUnregisterDialogOpen}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Unregister Team</DialogTitle>
              <DialogDescription>
                Are you sure you want to unregister your team from this
                tournament?
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              {unregisterError && (
                <div className="text-sm font-medium text-red-500">
                  {unregisterError}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsUnregisterDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => unregisterTeam(selectedTeamId)}
                disabled={unregistering}
              >
                {unregistering ? "Unregistering..." : "Unregister Team"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Tournament Dialog */}
        {tournament && (
          <EditTournamentDialog
            tournament={tournament}
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            onSuccess={handleEditSuccess}
          />
        )}

        {/* Reset Tournament Confirmation Dialog */}
        <Dialog open={resetConfirmOpen} onOpenChange={setResetConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reset Tournament?</DialogTitle>
              <DialogDescription>
                This will change the tournament status back to
                &quot;upcoming&quot; and allow teams to register again. Bracket
                information will be preserved but the tournament will no longer
                be in progress.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setResetConfirmOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={resetTournament}
                disabled={isLoadingAction}
              >
                {isLoadingAction ? "Resetting..." : "Reset Tournament"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
function setError(arg0: string) {
  throw new Error("Function not implemented.");
}
