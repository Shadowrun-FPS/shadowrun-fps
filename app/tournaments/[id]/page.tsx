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
import { Progress } from "@/components/ui/progress";
import { formatDate } from "@/lib/utils";
import { SECURITY_CONFIG } from "@/lib/security-config";

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
  registrationDeadline?: string;
  tournamentMatches?: {
    roundIndex: number;
    matchIndex: number;
    tournamentMatchId: string;
  }[];
  winner?: Team;
  teamStandings?: { team: Team; wins: number; losses: number }[];
  completedAt?: string;
  updatedAt?: string;
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
  tournamentMatchId?: string;
}

// Add type definition for the MemberAvatar props
interface MemberAvatarProps {
  profilePicture: string | null | undefined;
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

  return profilePicture && !imgError ? (
    <div
      className={`overflow-hidden relative rounded-full w-${size} h-${size} bg-slate-800`}
    >
      <Image
        src={profilePicture}
        alt={username || "Member"}
        width={size * 4}
        height={size * 4}
        className="object-cover"
        unoptimized
        onError={() => setImgError(true)}
      />
    </div>
  ) : (
    <div
      className={`flex justify-center items-center rounded-full w-${size} h-${size} bg-slate-800`}
    >
      <UserCircle className="w-full h-full text-slate-400" />
    </div>
  );
};

// Add a helper function to safely format dates
const safeFormatDate = (dateString: string | undefined | null): string => {
  if (!dateString) return "N/A";

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "N/A";
    return format(date, "MMM d, yyyy");
  } catch (error) {
    return "N/A";
  }
};

// Updated TournamentWinnerBanner component with better small screen support
const TournamentWinnerBanner = ({
  winner,
  completedAt,
}: {
  winner: Team;
  completedAt?: string;
}) => {
  return (
    <div className="overflow-hidden mt-8 rounded-lg shadow-lg">
      {/* Gradient background with more sophisticated colors */}
      <div className="relative p-4 bg-gradient-to-br via-blue-900 sm:p-6 md:p-8 from-slate-900 to-slate-800">
        {/* Trophy icon with glow effect - hidden on small screens */}
        <div className="hidden absolute top-0 right-0 w-32 h-32 opacity-10 md:block lg:w-48 lg:h-48">
          <Trophy className="w-full h-full text-yellow-300" />
        </div>

        {/* Header content */}
        <div className="relative">
          <div className="flex justify-center items-center">
            <div className="p-3 md:p-4 mb-2 md:mb-4 bg-gradient-to-br from-yellow-300 to-amber-600 rounded-full shadow-[0_0_15px_rgba(251,191,36,0.5)]">
              <Trophy className="w-10 h-10 text-white sm:w-12 sm:h-12 md:w-16 md:h-16" />
            </div>
          </div>

          <h2 className="mb-2 text-xl font-semibold text-center text-yellow-300 sm:text-2xl">
            TOURNAMENT CHAMPION
          </h2>

          <div className="relative py-2 mb-4 text-center md:py-3 md:mb-6">
            <div className="flex absolute inset-0 items-center">
              <div className="w-full border-t border-gray-600/40"></div>
            </div>
            <div className="flex relative justify-center">
              <span className="px-2 text-2xl font-bold tracking-wider text-white bg-gradient-to-br via-blue-900 md:px-4 sm:text-3xl md:text-4xl from-slate-900 to-slate-800">
                {winner.name}
              </span>
            </div>
          </div>

          {winner.tag && (
            <div className="flex justify-center mb-6">
              <span className="px-3 py-1 text-base font-medium text-white rounded-full md:text-lg bg-slate-700/70">
                [{winner.tag}]
              </span>
            </div>
          )}

          {/* Simplified team members section with more compact layout */}
          {winner.members && winner.members.length > 0 && (
            <div className="pt-4 mt-4 border-t border-gray-700">
              <h3 className="mb-3 text-sm font-semibold text-center text-gray-300">
                CHAMPIONSHIP ROSTER
              </h3>
              {/* Updated grid with more compact layout on medium+ screens */}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-1 md:max-w-[80%] mx-auto">
                {winner.members.map((member) => (
                  <Link
                    key={member.discordId}
                    href={`/player/stats?playerName=${member.discordUsername?.toLowerCase()}`}
                    className="flex flex-col items-center p-1 rounded-lg transition-colors hover:bg-blue-900/20"
                  >
                    <div className="w-12 h-12 md:w-14 md:h-14">
                      <MemberAvatar
                        profilePicture={member.discordProfilePicture}
                        username={member.discordUsername}
                        size={14}
                      />
                    </div>
                    <span className="mt-3 w-full text-sm font-medium text-center text-white break-words hyphens-auto">
                      {member.discordNickname || member.discordUsername}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Date footer */}
          <div className="mt-6 text-xs text-center text-gray-400 sm:text-sm">
            {completedAt
              ? format(new Date(completedAt), "MMMM d, yyyy")
              : "N/A"}
          </div>
        </div>
      </div>
    </div>
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
  const [isDeveloper, setIsDeveloper] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [isSeeded, setIsSeeded] = useState(false);
  const [unseeding, setUnseeding] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTournament = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/tournaments/${params?.id || ""}`);

      if (!response.ok) {
        if (response.status === 404) {
          // Tournament not found, redirect to overview page
          toast({
            title: "Tournament not found",
            description: "The tournament may have been deleted or moved.",
            variant: "destructive",
          });
          router.push("/tournaments/overview");
          return;
        }
        throw new Error("Failed to fetch tournament");
      }

      const data = await response.json();

      setTournament(data);

      // Reset current round to 0 when tournament is fetched
      setCurrentRound(0);

      // Make sure the bracket matches have tournamentMatchIds
      if (
        data.status === "active" &&
        data.tournamentMatches &&
        data.brackets?.rounds
      ) {
        // Map tournamentMatchIds from tournamentMatches to bracket matches
        const updatedRounds = [...data.brackets.rounds];

        data.tournamentMatches.forEach(
          (match: {
            roundIndex?: number;
            matchIndex?: number;
            tournamentMatchId: string;
          }) => {
            if (
              match.roundIndex !== undefined &&
              match.matchIndex !== undefined
            ) {
              const round = updatedRounds[match.roundIndex];
              if (round && round.matches[match.matchIndex]) {
                round.matches[match.matchIndex].tournamentMatchId =
                  match.tournamentMatchId;
              }
            }
          }
        );

        // Update the tournament with the correct match IDs
        setTournament({
          ...data,
          brackets: {
            ...data.brackets,
            rounds: updatedRounds,
          },
        });
      }
    } catch (error) {
      console.error("Error fetching tournament:", error);
      setError("Failed to fetch tournament");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params?.id) {
      fetchTournament();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params?.id]);

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
        try {
          // Fetch permissions from our API
          const response = await fetch("/api/user/permissions");
          if (response.ok) {
            const data = await response.json();
            setIsAdmin(data.isAdmin);

            // Set developer status separately for additional permissions
            setIsDeveloper(
              data.isDeveloper ||
                session.user.id === SECURITY_CONFIG.DEVELOPER_ID
            );
          }
        } catch (error) {
          console.error("Error checking permissions:", error);

          // Fallback: grant admin to developer ID
          if (session.user.id === SECURITY_CONFIG.DEVELOPER_ID) {
            setIsAdmin(true);
            setIsDeveloper(true);
          }
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

  useEffect(() => {
    if (tournament) {
      if (tournament.registeredTeams && tournament.registeredTeams.length > 0) {
        const team = tournament.registeredTeams[0];
      }
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
      const response = await fetch(
        `/api/tournaments/${params?.id || ""}/register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ teamId: selectedTeamId }),
        }
      );

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
    if (!tournament || !teamId) return;

    setUnregistering(true);
    setUnregisterError(null);

    try {
      console.log(
        `Unregistering team ${teamId} from tournament ${tournament._id}`
      );

      const response = await fetch(
        `/api/tournaments/${tournament._id}/unregister`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ teamId }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error("Error response:", data);
        throw new Error(data.error || "Failed to unregister team");
      }

      // Update the tournament data
      await fetchTournament();

      // Close the dialog if it was open
      setIsUnregisterDialogOpen(false);

      // Show success toast
      toast({
        title: "Team unregistered",
        description: "Your team has been unregistered from the tournament.",
      });
    } catch (error) {
      console.error("Error unregistering team:", error);
      setUnregisterError(
        error instanceof Error ? error.message : "Failed to unregister team"
      );
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
      const response = await fetch(
        `/api/tournaments/${params?.id || ""}/clear`,
        {
          method: "POST",
        }
      );

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
    if (!tournament) return;

    setLaunching(true);

    try {
      const response = await fetch(
        `/api/tournaments/${tournament._id}/launch`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            // Set the first round matches to live status
            updateMatchStatus: true,
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to launch tournament");
      }

      // Refresh tournament data
      await fetchTournament();

      toast({
        title: "Tournament Launched",
        description:
          "The tournament has been successfully launched and first round matches are now live.",
      });
    } catch (error) {
      console.error("Error launching tournament:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setLaunching(false);
    }
  };

  const handleUndoSeeding = async () => {
    if (!tournament) return;

    try {
      setUnseeding(true);

      const response = await fetch(
        `/api/tournaments/${tournament._id}/unseed`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to undo seeding");
      }

      toast({
        title: "Seeding removed",
        description: "Tournament bracket has been reset",
      });

      // Refresh tournament data
      await fetchTournament();
    } catch (error) {
      console.error("Error removing seeding:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to undo seeding",
        variant: "destructive",
      });
    } finally {
      setUnseeding(false);
    }
  };

  const handleEditSuccess = async () => {
    // Fetch the updated tournament data
    await fetchTournament();

    // Show success toast
    toast({
      title: "Tournament Updated",
      description: "The tournament has been successfully updated.",
    });
  };

  const handleResetTournament = async () => {
    if (!tournament) return;

    setResetting(true);

    try {
      const response = await fetch(`/api/tournaments/${tournament._id}/reset`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to reset tournament");
      }

      // Refresh tournament data
      await fetchTournament();

      toast({
        title: "Tournament Reset",
        description:
          "The tournament has been reset to upcoming status and all matches have been reset.",
      });
    } catch (error) {
      console.error("Error resetting tournament:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setResetting(false);
    }
  };

  useEffect(() => {
    if (tournament?.teamStandings) {
      console.log("Tournament standings:", tournament.teamStandings);
    }
  }, [tournament?.teamStandings]);

  if (loading) {
    return (
      <div className="container py-8 mx-auto">
        <div className="w-full h-64 rounded-lg animate-pulse bg-gray-800/50"></div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="container py-8 mx-auto">
        <Card>
          <CardContent className="flex flex-col justify-center items-center py-12">
            <HelpCircle className="mb-4 w-12 h-12 text-muted-foreground" />
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
        <div className="mb-6">
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col space-y-2">
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-0 h-auto"
                  onClick={() => router.push("/tournaments/overview")}
                >
                  <ChevronLeft className="mr-1 w-5 h-5" />
                  <span className="text-sm">Back</span>
                </Button>

                {isAdmin && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="ml-auto sm:ml-0"
                    onClick={() => setIsEditDialogOpen(true)}
                  >
                    Edit Tournament
                  </Button>
                )}
              </div>

              <h1 className="text-2xl font-bold sm:text-3xl">
                {tournament.name}
              </h1>
            </div>

            <div className="flex flex-wrap gap-2 items-center mt-2 sm:mt-0">
              <div className="flex items-center text-sm">
                <Calendar className="mr-1 w-4 h-4" />
                {format(new Date(tournament.startDate), "MMMM d, yyyy")}
              </div>

              <div className="flex items-center text-sm">
                <Trophy className="mr-1 w-4 h-4" />
                {tournament.format === "single_elimination"
                  ? "Single Elimination"
                  : "Double Elimination"}
              </div>

              <div className="flex items-center text-sm">
                <Users className="mr-1 w-4 h-4" />
                {tournament.teamSize} vs {tournament.teamSize}
              </div>

              <Badge
                variant={
                  tournament.status === "upcoming"
                    ? "outline"
                    : tournament.status === "active"
                    ? "default"
                    : "secondary"
                }
                className={
                  tournament.status === "upcoming"
                    ? "bg-blue-900/20 text-blue-400 hover:bg-blue-900/20"
                    : tournament.status === "active"
                    ? "bg-green-900/20 text-green-400 hover:bg-green-900/20"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-800"
                }
              >
                {tournament.status === "upcoming"
                  ? "Upcoming"
                  : tournament.status === "active"
                  ? "Active"
                  : "Completed"}
              </Badge>
            </div>
          </div>

          {/* Registration Progress */}
          <div className="mt-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-muted-foreground">
                Registration: {tournament.registeredTeams.length}/
                {tournament.maxTeams || 8} teams
              </span>
              {tournament.registrationDeadline && (
                <span className="text-sm text-muted-foreground">
                  <Clock className="inline mr-1 w-4 h-4" />
                  Deadline:{" "}
                  {format(
                    new Date(tournament.registrationDeadline),
                    "MMM d, yyyy"
                  )}
                </span>
              )}
            </div>
            <Progress
              value={
                (tournament.registeredTeams.length /
                  (tournament.maxTeams || 8)) *
                100
              }
              className="h-2"
            />
          </div>
        </div>

        {/* Add this inside your Tournament component before the tabs section */}
        {tournament.status === "completed" && tournament.winner && (
          <TournamentWinnerBanner
            winner={tournament.winner}
            completedAt={tournament.completedAt}
          />
        )}

        {/* Tabs Navigation */}
        <Tabs
          defaultValue="bracket"
          value={activeTab}
          onValueChange={setActiveTab}
          className="mb-6"
        >
          <TabsList className="mb-6 w-full h-14 bg-transparent rounded-none border-b">
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
                {tournament?.brackets?.rounds?.length > 0 ? (
                  <TournamentBracket
                    rounds={tournament.brackets.rounds}
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
                ) : (
                  <div className="py-8 text-center">
                    <p className="text-muted-foreground">
                      No bracket available yet.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Add a debug section at the bottom of the bracket tab for admins */}
            {isAdmin && (
              <div className="p-4 mt-8 rounded border bg-muted/10">
                <h3 className="mb-2 text-lg font-semibold">
                  Tournament Seeding (Admin View)
                </h3>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 sm:gap-4">
                  {tournament.registeredTeams.map((team, index) => (
                    <div
                      key={team._id}
                      className="flex gap-2 items-center p-2 rounded border"
                    >
                      <Badge variant="outline">{index + 1}</Badge>
                      <span className="truncate">{team.name}</span>
                      <span className="ml-auto text-xs whitespace-nowrap text-muted-foreground">
                        ELO: {team.teamElo || "N/A"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Standings Content */}
          <TabsContent value="standings" className="mt-0">
            {tournament.teamStandings ? (
              <div className="mt-4">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-2 text-left">Team</th>
                      <th className="px-4 py-2 text-center">W</th>
                      <th className="px-4 py-2 text-center">L</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tournament.teamStandings
                      .sort((a, b) => b.wins - a.wins)
                      .map((team, index) => (
                        <tr
                          key={team.team._id.toString()}
                          className={index % 2 ? "bg-muted/10" : ""}
                        >
                          <td className="px-4 py-3 font-medium">
                            {team.team.name}
                            {team.team.tag && (
                              <span className="ml-2 text-sm text-muted-foreground">
                                [{team.team.tag}]
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">{team.wins}</td>
                          <td className="px-4 py-3 text-center">
                            {team.losses}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="mt-4 text-muted-foreground">
                No standings available yet.
              </p>
            )}
          </TabsContent>

          {/* Teams Content */}
          <TabsContent value="teams" className="pt-4">
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold">
                    Registered Teams
                    <Badge variant="outline" className="ml-2">
                      {tournament.registeredTeams.length}/
                      {tournament.maxTeams || 8} Teams
                    </Badge>
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Teams that have registered for this tournament
                  </p>
                </div>

                {tournament.status === "upcoming" && session && (
                  <Button
                    onClick={() => setIsRegisterDialogOpen(true)}
                    disabled={
                      tournament.registeredTeams.length >=
                        (tournament.maxTeams || 8) ||
                      userTeams.length === 0 ||
                      userTeams.every((team) => isTeamRegistered(team._id))
                    }
                    className="mt-4 sm:mt-0"
                  >
                    Register Team
                  </Button>
                )}
              </div>

              {/* Teams Grid - Responsive for mobile */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {tournament.registeredTeams.map((team) => (
                  <Card key={team._id} className="overflow-hidden">
                    <div className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-2">
                          <Badge
                            variant="outline"
                            className="px-2 h-6 font-mono"
                          >
                            #
                            {tournament.registeredTeams.findIndex(
                              (t) => t._id === team._id
                            ) + 1}
                          </Badge>
                          <div>
                            <h3 className="font-semibold">
                              {team.name}{" "}
                              <span className="text-sm text-muted-foreground">
                                [{team.tag}]
                              </span>
                            </h3>
                            {team.teamElo && (
                              <div className="text-xs text-muted-foreground">
                                ELO: {team.teamElo.toLocaleString()}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action buttons - aligned to the right */}
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              router.push(`/tournaments/teams/${team._id}`)
                            }
                          >
                            View Team
                          </Button>
                          {(isAdmin ||
                            (session?.user?.id === team.captain?.discordId &&
                              tournament.status === "upcoming")) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-600 hover:bg-red-100/10"
                              onClick={() => unregisterTeam(team._id)}
                              disabled={unregistering}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Team members section - more compact on mobile */}
                      <div className="mt-4">
                        <div className="flex flex-col space-y-3">
                          <div className="flex items-center space-x-2">
                            <MemberAvatar
                              profilePicture={
                                team.captain?.discordProfilePicture
                              }
                              username={team.captain?.discordUsername}
                              size={8}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {team.captain?.discordNickname ||
                                  team.captain?.discordUsername}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Team Captain
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {team.members
                              ?.filter(
                                (member) =>
                                  member.discordId !== team.captain?.discordId
                              )
                              .map((member) => (
                                <div
                                  key={member.discordId}
                                  title={
                                    member.discordNickname ||
                                    member.discordUsername
                                  }
                                >
                                  <MemberAvatar
                                    profilePicture={
                                      member.discordProfilePicture
                                    }
                                    username={member.discordUsername}
                                    size={8}
                                  />
                                </div>
                              ))}
                          </div>
                        </div>
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
                      <div className="flex flex-col items-center justify-center p-6 h-full min-h-[150px] text-muted-foreground">
                        <Users className="mb-2 w-8 h-8 opacity-40" />
                        <p className="text-center">Waiting for team...</p>
                      </div>
                    </Card>
                  ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Admin Controls Section */}
        {isAdmin && tournament && (
          <div className="p-4 mt-8 rounded-lg border bg-slate-900">
            <h3 className="mb-4 text-lg font-semibold">Admin Controls</h3>
            <div className="flex flex-wrap gap-3 items-center">
              {tournament.status === "upcoming" && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={isSeeded ? handleUndoSeeding : handlePreseed}
                        disabled={
                          (isSeeded ? unseeding : seeding) ||
                          tournament.status !== "upcoming" ||
                          (!isSeeded &&
                            tournament.registeredTeams.length !==
                              (tournament.maxTeams || 8))
                        }
                        className="flex gap-1 items-center"
                      >
                        {isSeeded ? (
                          unseeding ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />{" "}
                              Removing Seeding...
                            </>
                          ) : (
                            <>
                              <RotateCcw className="w-4 h-4" /> Undo Seeding
                            </>
                          )
                        ) : seeding ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />{" "}
                            Pre-seeding...
                          </>
                        ) : (
                          <>
                            <Shuffle className="w-4 h-4" /> Pre-seed Teams
                          </>
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {isSeeded ? (
                        <p>Reset the tournament bracket to unseeded state</p>
                      ) : (
                        tournament.registeredTeams.length !==
                          (tournament.maxTeams || 8) && (
                          <p>
                            ({tournament.registeredTeams.length}/
                            {tournament.maxTeams || 8} teams required for
                            pre-seeding)
                          </p>
                        )
                      )}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {/* Testing buttons - only visible to developer */}
              {isDeveloper && (
                <>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          className="flex gap-2 items-center"
                          onClick={() => handleFillTournament()}
                        >
                          <Users className="w-4 h-4" />
                          Fill Tournament
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Fill tournament with random teams (testing)</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          className="flex gap-2 items-center text-red-500 hover:text-red-600"
                          onClick={() => handleClearTournament()}
                        >
                          <X className="w-4 h-4" />
                          Clear Teams
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Remove all teams from tournament (testing)</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </>
              )}

              {/* Launch tournament button - visible to all admins */}
              {tournament.status === "upcoming" &&
                tournament.registeredTeams.length === tournament.maxTeams && (
                  <Button
                    variant="default"
                    className="text-white bg-green-600 hover:bg-green-700"
                    onClick={handleLaunchTournament}
                    disabled={launching}
                  >
                    {launching ? (
                      <>
                        <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                        Launching...
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 w-4 h-4" />
                        Launch Tournament
                      </>
                    )}
                  </Button>
                )}

              {tournament.status === "active" && isAdmin && (
                <Button
                  variant="outline"
                  className="flex gap-2 items-center text-yellow-500 hover:text-yellow-600"
                  onClick={handleResetTournament}
                  disabled={resetting}
                >
                  {resetting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-4 h-4" />
                      Reset Tournament
                    </>
                  )}
                </Button>
              )}
            </div>
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
      </div>
    </div>
  );
}
