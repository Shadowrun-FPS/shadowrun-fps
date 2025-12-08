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
import { formatDate, cn } from "@/lib/utils";
import { SECURITY_CONFIG } from "@/lib/security-config";
import { canManageTournament } from "@/lib/tournament-permissions";

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
  coHosts?: string[]; // Array of player IDs
  createdBy?: { userId?: string; discordId?: string; name?: string };
}

interface Team {
  _id: string;
  name: string;
  tag: string;
  teamElo?: number;
  createdAt?: string;
  teamSize?: number;
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

  // Map size numbers to Tailwind classes
  const sizeClasses: Record<number, string> = {
    8: "w-8 h-8",
    10: "w-10 h-10",
    12: "w-12 h-12",
    14: "w-14 h-14",
    16: "w-16 h-16",
  };
  const sizeClass = sizeClasses[size] || "w-10 h-10";

  return profilePicture && !imgError ? (
    <div
      className={`overflow-hidden relative rounded-full ${sizeClass} bg-slate-800`}
    >
      <Image
        src={profilePicture}
        alt={username || "Member"}
        width={size * 4}
        height={size * 4}
        loading="lazy"
        className="object-cover"
        unoptimized
        onError={() => setImgError(true)}
      />
    </div>
  ) : (
    <div
      className={`flex justify-center items-center rounded-full ${sizeClass} bg-slate-800`}
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
  const [activeTab, setActiveTab] = useState("teams");
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
  const [canManage, setCanManage] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [isSeeded, setIsSeeded] = useState(false);
  const [unseeding, setUnseeding] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFillDialogOpen, setIsFillDialogOpen] = useState(false);
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);

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
    const fetchTeams = async () => {
      if (!session?.user?.id) return;

      try {
        // For admins/founders/developers/co-hosts, fetch all teams
        // For regular users, fetch only their teams
        if (isAdmin || isDeveloper || canManage) {
          const response = await fetch(`/api/teams`);
          if (response.ok) {
            const data = await response.json();
            setUserTeams(data || []);
          }
        } else {
          const response = await fetch(`/api/users/teams`);
          if (response.ok) {
            const data = await response.json();
            setUserTeams(data.teams || []);
          }
        }
      } catch (error) {
        console.error("Error fetching teams:", error);
      }
    };

    if (session) {
      fetchTeams();
    }
  }, [session, isAdmin, isDeveloper, canManage]);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (session?.user?.id) {
        try {
          // Fetch permissions from our API
          const response = await fetch("/api/user/permissions");
          if (response.ok) {
            const data = await response.json();
            // Admin includes admin role, founder role, and developer
            setIsAdmin(data.isAdmin || data.isModerator);

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

  // Check if user can manage this tournament (admin, creator, or co-host)
  useEffect(() => {
    if (session?.user?.id && tournament) {
      const userRoles = session.user.roles || [];
      const hasManagePermission = canManageTournament(
        session.user.id,
        userRoles,
        tournament
      );
      setCanManage(hasManagePermission);
    } else {
      setCanManage(false);
    }
  }, [session, tournament]);

  useEffect(() => {
    if (tournament) {
      // Determine if tournament is seeded by checking if any bracket matches have teams assigned
      const hasSeededTeams = tournament.brackets?.rounds?.[0]?.matches?.some(
        (match: any) => match.teamA || match.teamB
      );
      setIsSeeded(!!hasSeededTeams);

      // Set default tab: "bracket" if seeded or launched, otherwise "teams"
      const isLaunched = tournament.status === "active" || tournament.status === "completed";
      if (hasSeededTeams || isLaunched) {
        setActiveTab("bracket");
      } else {
        setActiveTab("teams");
      }
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
        description: data.unseeded
          ? "Your team has been unregistered. Tournament seeding has been automatically removed."
          : "Your team has been unregistered from the tournament.",
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

  // Filter eligible teams: must match tournament teamSize and be full
  const eligibleTeams = useMemo(() => {
    if (!tournament || !userTeams.length) return [];
    
    const tournamentTeamSize = tournament.teamSize || 4;
    
    return userTeams.filter((team) => {
      // Team size must match tournament team size
      const teamTeamSize = team.teamSize || 4;
      if (teamTeamSize !== tournamentTeamSize) return false;
      
      // Team must be full (have exactly the required number of members)
      const memberCount = team.members?.length || 0;
      const captainInMembers = team.members?.some(
        (m: any) => m.discordId === team.captain?.discordId
      );
      const totalMembers = captainInMembers ? memberCount : memberCount + 1;
      
      return totalMembers === tournamentTeamSize;
    });
  }, [userTeams, tournament]);

  const canRegister =
    eligibleTeams.length > 0 &&
    tournament?.status === "upcoming" &&
    tournament?.registeredTeams.length < (tournament?.maxTeams || 8);

  const isTeamRegistered = (teamId: string) => {
    return (
      tournament?.registeredTeams?.some((team) => team._id === teamId) || false
    );
  };

  // Find the user's registered team (if any)
  const userRegisteredTeam = useMemo(() => {
    if (!tournament || !session || !eligibleTeams.length) return null;
    
    // Find the first eligible team that is registered and where user is captain
    return eligibleTeams.find((team) => {
      const isRegistered = tournament.registeredTeams?.some(
        (regTeam) => regTeam._id === team._id
      ) || false;
      const isCaptain = team.captain?.discordId === session.user.id;
      return isRegistered && isCaptain;
    }) || null;
  }, [tournament, session, eligibleTeams]);

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

    setIsFillDialogOpen(false);

    try {
      const response = await fetch(`/api/tournaments/${tournament._id}/fill`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to fill tournament");
      }

      // Refresh tournament data
      await fetchTournament();

      toast({
        title: "Success",
        description: "Tournament filled with random teams",
      });
    } catch (error) {
      console.error("Error filling tournament:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to fill tournament",
        variant: "destructive",
      });
    }
  };

  const handleClearTournament = async () => {
    setIsClearDialogOpen(false);

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
    <div className="min-h-screen bg-background">
      <div className="container px-4 py-6 mx-auto sm:px-6 lg:px-8">
        {/* Tournament Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 -ml-2"
                  onClick={() => router.push("/tournaments/overview")}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  <span className="text-sm">Back</span>
                </Button>

                {(isAdmin || canManage) && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9"
                    onClick={() => setIsEditDialogOpen(true)}
                  >
                    Edit Tournament
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
                  {tournament.name}
                </h1>
                {tournament.description && (
                  <p className="text-sm sm:text-base text-muted-foreground max-w-3xl">
                    {tournament.description}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 sm:gap-3 items-center sm:justify-end">
              <div className="flex items-center gap-1.5 text-sm">
                <div className="p-1.5 rounded-md bg-primary/10 border border-primary/20">
                  <Calendar className="w-3.5 h-3.5 text-primary" />
                </div>
                <span className="text-foreground">
                  {format(new Date(tournament.startDate), "MMM d, yyyy")}
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-sm">
                <div className="p-1.5 rounded-md bg-primary/10 border border-primary/20">
                  <Trophy className="w-3.5 h-3.5 text-primary" />
                </div>
                <span className="text-foreground">
                  {tournament.format === "single_elimination"
                    ? "Single Elimination"
                    : "Double Elimination"}
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-sm">
                <div className="p-1.5 rounded-md bg-primary/10 border border-primary/20">
                  <Users className="w-3.5 h-3.5 text-primary" />
                </div>
                <span className="text-foreground">
                  {tournament.teamSize}v{tournament.teamSize}
                </span>
              </div>

              {tournament.coHosts && tournament.coHosts.length > 0 && (
                <div className="flex items-center gap-1.5 text-sm">
                  <div className="p-1.5 rounded-md bg-primary/10 border border-primary/20">
                    <UserCircle className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <span className="text-foreground">
                    {tournament.coHosts.length} Co-Host{tournament.coHosts.length !== 1 ? "s" : ""}
                  </span>
                </div>
              )}

              <Badge
                variant="secondary"
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium",
                  tournament.status === "upcoming" &&
                    "bg-blue-500/20 text-blue-400 border-blue-500/30",
                  tournament.status === "active" &&
                    "bg-green-500/20 text-green-400 border-green-500/30",
                  tournament.status === "completed" &&
                    "bg-muted text-muted-foreground"
                )}
              >
                {tournament.status === "upcoming"
                  ? "Upcoming"
                  : tournament.status === "active"
                  ? "Active"
                  : "Completed"}
              </Badge>
            </div>
          </div>

          {/* Co-Hosts Display */}
          {tournament.coHosts && tournament.coHosts.length > 0 && (
            <div className="mt-4 p-3 rounded-lg border bg-muted/30">
              <div className="flex items-center gap-2 mb-2">
                <UserCircle className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-semibold">Co-Hosts</span>
              </div>
              <p className="text-xs text-muted-foreground">
                These players can help manage this tournament: edit details, pre-seed teams, launch the tournament, and manage team registrations.
              </p>
            </div>
          )}

          {/* Registration Progress */}
          <div className="mt-6 p-4 rounded-lg border bg-muted/30">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">
                  Registration Progress
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-muted-foreground">
                  {tournament.registeredTeams.length}/{tournament.maxTeams || 8} teams
                </span>
                {tournament.registrationDeadline && (
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      Deadline:{" "}
                      {format(
                        new Date(tournament.registrationDeadline),
                        "MMM d, yyyy"
                      )}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <Progress
              value={
                (tournament.registeredTeams.length /
                  (tournament.maxTeams || 8)) *
                100
              }
              className="h-2.5"
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
          defaultValue="teams"
          value={activeTab}
          onValueChange={setActiveTab}
          className="mb-6"
        >
          <TabsList className="mb-6 w-full h-auto bg-transparent rounded-lg border p-1">
            <TabsTrigger
              value="bracket"
              className="flex-1 h-11 rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground touch-manipulation"
            >
              <Trophy className="w-4 h-4 mr-2" />
              Bracket
            </TabsTrigger>
            <TabsTrigger
              value="standings"
              className="flex-1 h-11 rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground touch-manipulation"
            >
              <Users className="w-4 h-4 mr-2" />
              Standings
            </TabsTrigger>
            <TabsTrigger
              value="teams"
              className="flex-1 h-11 rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground touch-manipulation"
            >
              <Users className="w-4 h-4 mr-2" />
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
                {/* Bracket Type Selector for Double Elimination */}
                {tournament.format === "double_elimination" &&
                  tournament.brackets?.losersRounds &&
                  tournament.brackets.losersRounds.length > 0 && (
                    <div className="mb-6 space-y-3">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant={currentBracket === "winners" ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            setCurrentBracket("winners");
                            setCurrentRound(0);
                          }}
                          className="h-9"
                        >
                          Winners Bracket
                        </Button>
                        <Button
                          variant={currentBracket === "losers" ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            setCurrentBracket("losers");
                            setCurrentRound(0);
                          }}
                          className="h-9"
                        >
                          Losers Bracket
                        </Button>
                      </div>
                      <p className="text-xs text-center text-muted-foreground">
                        Use the buttons above to switch between the Winners and Losers brackets
                      </p>
                    </div>
                  )}

                {tournament?.brackets?.rounds?.length > 0 ||
                (tournament.format === "double_elimination" &&
                  (tournament.brackets?.losersRounds?.length ?? 0) > 0) ? (
                  <TournamentBracket
                    rounds={rounds}
                    currentRound={currentRound}
                    onPreviousRound={() =>
                      setCurrentRound(Math.max(0, currentRound - 1))
                    }
                    onNextRound={() =>
                      setCurrentRound(
                        Math.min(
                          (rounds?.length || 1) - 1,
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

            {/* Seeding Information (Admin/Co-Host View) */}
            {(isAdmin || canManage) && tournament.registeredTeams.length > 0 && (
              <div className="p-4 mt-8 rounded-lg border bg-muted/30">
                <h3 className="mb-4 text-lg font-semibold flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-primary" />
                  Tournament Seeding (Admin View)
                </h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {[...tournament.registeredTeams]
                    .sort((a, b) => (b.teamElo || 0) - (a.teamElo || 0))
                    .map((team, index) => {
                      const seed = index + 1;
                      return (
                        <div
                          key={team._id}
                          className="flex gap-3 items-center p-3 rounded-lg border bg-background/50 hover:bg-muted/50 transition-colors"
                        >
                          <Badge
                            variant={seed <= 4 ? "default" : "outline"}
                            className={cn(
                              "font-mono font-bold min-w-[2.5rem] justify-center",
                              seed === 1 && "bg-yellow-500/20 text-yellow-400 border-yellow-500/50",
                              seed === 2 && "bg-gray-400/20 text-gray-300 border-gray-400/50",
                              seed === 3 && "bg-amber-600/20 text-amber-500 border-amber-600/50"
                            )}
                          >
                            #{seed}
                          </Badge>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{team.name}</p>
                            {team.tag && (
                              <p className="text-xs text-muted-foreground">[{team.tag}]</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-medium text-muted-foreground">
                              {team.teamElo ? team.teamElo.toLocaleString() : "N/A"}
                            </p>
                            <p className="text-[10px] text-muted-foreground">ELO</p>
                          </div>
                        </div>
                      );
                    })}
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  Teams are seeded by ELO (highest to lowest). Seed #1 = highest ELO.
                </p>
              </div>
            )}
          </TabsContent>

          {/* Standings Content */}
          <TabsContent value="standings" className="mt-0">
            {tournament.teamStandings && tournament.teamStandings.length > 0 ? (
              <div className="mt-4">
                <div className="rounded-lg border overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted/50 border-b">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Rank</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Team</th>
                          <th className="px-4 py-3 text-center text-sm font-semibold">Wins</th>
                          <th className="px-4 py-3 text-center text-sm font-semibold">Losses</th>
                          <th className="px-4 py-3 text-center text-sm font-semibold">Win Rate</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tournament.teamStandings
                          .sort((a, b) => {
                            // Sort by wins first, then by win rate
                            if (b.wins !== a.wins) return b.wins - a.wins;
                            const aTotal = a.wins + a.losses;
                            const bTotal = b.wins + b.losses;
                            if (aTotal === 0 && bTotal === 0) return 0;
                            if (aTotal === 0) return 1;
                            if (bTotal === 0) return -1;
                            return b.wins / bTotal - a.wins / aTotal;
                          })
                          .map((team, index) => {
                            const totalGames = team.wins + team.losses;
                            const winRate = totalGames > 0 ? (team.wins / totalGames) * 100 : 0;
                            return (
                              <tr
                                key={team.team._id.toString()}
                                className={cn(
                                  "border-b transition-colors hover:bg-muted/30",
                                  index % 2 === 0 ? "bg-background" : "bg-muted/10"
                                )}
                              >
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    {index < 3 && (
                                      <Trophy
                                        className={cn(
                                          "w-4 h-4",
                                          index === 0 && "text-yellow-400",
                                          index === 1 && "text-gray-300",
                                          index === 2 && "text-amber-600"
                                        )}
                                      />
                                    )}
                                    <span className="font-semibold text-muted-foreground">
                                      #{index + 1}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex flex-col">
                                    <span className="font-medium">{team.team.name}</span>
                                    {team.team.tag && (
                                      <span className="text-xs text-muted-foreground">
                                        [{team.team.tag}]
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-center font-medium text-green-400">
                                  {team.wins}
                                </td>
                                <td className="px-4 py-3 text-center font-medium text-red-400">
                                  {team.losses}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <span className="font-medium">
                                    {winRate.toFixed(1)}%
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-4 p-8 text-center rounded-lg border bg-muted/30">
                <Trophy className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">
                  No standings available yet. Standings will appear once the tournament begins.
                </p>
              </div>
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
                    onClick={() => {
                      if (userRegisteredTeam) {
                        // If team is registered, unregister it
                        unregisterTeam(userRegisteredTeam._id);
                      } else {
                        // Otherwise, open register dialog
                        setIsRegisterDialogOpen(true);
                      }
                    }}
                    disabled={
                      userRegisteredTeam
                        ? unregistering
                        : tournament.registeredTeams.length >=
                            (tournament.maxTeams || 8) ||
                          eligibleTeams.length === 0 ||
                          eligibleTeams.every((team) => isTeamRegistered(team._id))
                    }
                    variant={userRegisteredTeam ? "destructive" : "default"}
                    className="mt-4 sm:mt-0"
                  >
                    {userRegisteredTeam
                      ? unregistering
                        ? "Unregistering..."
                        : "Unregister"
                      : "Register Team"}
                  </Button>
                )}
              </div>

              {/* Teams Grid - Responsive for mobile */}
              <div className="grid grid-cols-1 gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {[...tournament.registeredTeams]
                  .sort((a, b) => (b.teamElo || 0) - (a.teamElo || 0))
                  .map((team, index) => {
                    const teamIndex = index + 1; // Seed based on sorted ELO order
                  const otherMembers = team.members?.filter(
                    (member) =>
                      member.discordId !== team.captain?.discordId
                  ) || [];

                  return (
                    <Card
                      key={team._id}
                      className="group overflow-hidden transition-all hover:shadow-lg hover:shadow-primary/5 hover:border-primary/30 border flex flex-col"
                    >
                        <div className="p-4 sm:p-5 flex flex-col flex-1">
                          {/* Header with rank badge and team name */}
                          <div className="flex items-start justify-between gap-3 mb-4">
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                              <Badge
                                variant="outline"
                                className={cn(
                                  "shrink-0 px-2.5 py-1 h-7 font-mono text-sm font-bold",
                                  teamIndex === 1 &&
                                    "bg-yellow-500/20 text-yellow-400 border-yellow-500/50",
                                  teamIndex === 2 &&
                                    "bg-gray-400/20 text-gray-300 border-gray-400/50",
                                  teamIndex === 3 &&
                                    "bg-amber-600/20 text-amber-500 border-amber-600/50"
                                )}
                              >
                                #{teamIndex}
                              </Badge>
                              <div className="flex-1 min-w-0 min-h-[3.5rem] flex flex-col justify-start">
                                <h3 className="font-semibold text-base sm:text-lg leading-tight mb-1 line-clamp-2 break-words min-h-[2.5rem]">
                                  {team.name}
                                </h3>
                                <div className="flex items-center gap-2 flex-wrap mt-auto">
                                  <span className="text-xs sm:text-sm text-muted-foreground font-medium">
                                    [{team.tag}]
                                  </span>
                                  {team.teamElo && (
                                    <Badge
                                      variant="secondary"
                                      className="text-xs font-medium px-2 py-0.5"
                                    >
                                      {team.teamElo.toLocaleString()} ELO
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Action buttons */}
                            {((isAdmin || canManage) ||
                              (session?.user?.id === team.captain?.discordId &&
                                tournament.status === "upcoming")) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="shrink-0 h-8 w-8 p-0 text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                                onClick={() => {
                                  setSelectedTeamId(team._id);
                                  setIsUnregisterDialogOpen(true);
                                }}
                                disabled={unregistering}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            )}
                          </div>

                          {/* Captain section */}
                          <div className="mb-4 pb-4 border-b">
                            <div className="flex items-center gap-3">
                              <MemberAvatar
                                profilePicture={
                                  team.captain?.discordProfilePicture
                                }
                                username={team.captain?.discordUsername}
                                size={10}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {team.captain?.discordNickname ||
                                    team.captain?.discordUsername ||
                                    "Unknown"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Captain
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Team members avatars */}
                          <div className="mb-4 flex-1">
                            {otherMembers.length > 0 ? (
                              <>
                                {tournament.teamSize === 2 ? (
                                  // For 2v2, show the other player with their nickname
                                  <div className="flex items-center gap-2">
                                    {otherMembers[0] && (
                                      <>
                                        <MemberAvatar
                                          profilePicture={
                                            otherMembers[0].discordProfilePicture
                                          }
                                          username={otherMembers[0].discordUsername}
                                          size={10}
                                        />
                                        <span className="text-sm font-medium text-foreground">
                                          {otherMembers[0].discordNickname ||
                                            otherMembers[0].discordUsername}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                ) : (
                                  // For other team sizes, show members list
                                  <>
                                    <p className="text-xs text-muted-foreground mb-2 font-medium">
                                      Members ({otherMembers.length})
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                      {otherMembers.map((member) => (
                                        <TooltipProvider key={member.discordId}>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <div className="cursor-default">
                                                <MemberAvatar
                                                  profilePicture={
                                                    member.discordProfilePicture
                                                  }
                                                  username={member.discordUsername}
                                                  size={10}
                                                />
                                              </div>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              <p>
                                                {member.discordNickname ||
                                                  member.discordUsername}
                                              </p>
                                            </TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>
                                      ))}
                                    </div>
                                  </>
                                )}
                              </>
                            ) : (
                              <div className="min-h-[2.5rem]" />
                            )}
                          </div>

                          {/* View Team button */}
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full h-9 text-sm font-medium mt-auto"
                            onClick={() =>
                              router.push(`/tournaments/teams/${team._id}`)
                            }
                          >
                            View Team
                          </Button>
                        </div>
                      </Card>
                  );
                })}

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

        {/* Admin/Co-Host Controls Section */}
        {(isAdmin || canManage) && tournament && (
          <div className="p-6 mt-8 rounded-lg border bg-muted/30">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-md bg-primary/10 border border-primary/20">
                <Shuffle className="w-4 h-4 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">Admin Controls</h3>
            </div>
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
              {isDeveloper && tournament.status === "upcoming" && (
                <>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div>
                          <Button
                            variant="outline"
                            className="flex gap-2 items-center"
                            onClick={() => setIsFillDialogOpen(true)}
                            disabled={tournament.status !== "upcoming"}
                          >
                            <Users className="w-4 h-4" />
                            Fill Tournament
                          </Button>
                        </div>
                      </TooltipTrigger>
                      {tournament.status !== "upcoming" && (
                        <TooltipContent>
                          <p>Tournament must be reset before filling teams</p>
                        </TooltipContent>
                      )}
                      {tournament.status === "upcoming" && (
                        <TooltipContent>
                          <p>Fill tournament with random teams (testing)</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div>
                          <Button
                            variant="outline"
                            className="flex gap-2 items-center text-red-500 hover:text-red-600"
                            onClick={() => setIsClearDialogOpen(true)}
                            disabled={tournament.status !== "upcoming"}
                          >
                            <X className="w-4 h-4" />
                            Clear Teams
                          </Button>
                        </div>
                      </TooltipTrigger>
                      {tournament.status !== "upcoming" && (
                        <TooltipContent>
                          <p>Tournament must be reset before clearing teams</p>
                        </TooltipContent>
                      )}
                      {tournament.status === "upcoming" && (
                        <TooltipContent>
                          <p>Remove all teams from tournament (testing)</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                </>
              )}

              {/* Launch tournament button - visible to all admins */}
              {tournament.status === "upcoming" &&
                tournament.registeredTeams.length === tournament.maxTeams && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div>
                          <Button
                            variant="default"
                            className="text-white bg-green-600 hover:bg-green-700"
                            onClick={handleLaunchTournament}
                            disabled={launching || !isSeeded}
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
                        </div>
                      </TooltipTrigger>
                      {!isSeeded && (
                        <TooltipContent>
                          <p>Teams must be pre-seeded before launching</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                )}

              {tournament.status === "active" && (isAdmin || canManage) && (
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
          <DialogContent className="sm:max-w-[500px] px-4 sm:px-6 py-4 sm:py-6">
            <DialogHeader className="space-y-3 pb-4 border-b">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <DialogTitle className="text-2xl font-bold">
                    Register Team
                  </DialogTitle>
                  <DialogDescription className="mt-1">
                    Select a team to register for this tournament.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            {eligibleTeams.length > 0 ? (
              <>
                <div className="py-4 space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">
                      Select Team
                    </label>
                    <Select
                      value={selectedTeamId}
                      onValueChange={setSelectedTeamId}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Choose a team to register" />
                      </SelectTrigger>
                      <SelectContent>
                        {eligibleTeams.map((team) => (
                          <SelectItem
                            key={team._id}
                            value={team._id}
                            disabled={isTeamRegistered(team._id)}
                            className={isTeamRegistered(team._id) ? "opacity-50" : ""}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="font-medium">{team.name}</span>
                              {team.tag && (
                                <span className="ml-2 text-xs text-muted-foreground">
                                  [{team.tag}]
                                </span>
                              )}
                              {isTeamRegistered(team._id) && (
                                <span className="ml-2 text-xs text-muted-foreground">
                                  (Already registered)
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {registerError && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                      <p className="text-sm font-medium text-red-500">
                        {registerError}
                      </p>
                    </div>
                  )}
                </div>

                <DialogFooter className="gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setIsRegisterDialogOpen(false)}
                    className="w-full sm:w-auto"
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
                    className="w-full sm:w-auto"
                  >
                    {registering ? (
                      <>
                        <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                        Registering...
                      </>
                    ) : (
                      "Register Team"
                    )}
                  </Button>
                </DialogFooter>
              </>
            ) : (
              <div className="py-6 text-center space-y-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <Users className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground mb-4">
                    {tournament?.teamSize
                      ? `You don't have any ${tournament.teamSize}v${tournament.teamSize} teams that are full and ready to register.`
                      : "You don't have any eligible teams to register for this tournament."}
                  </p>
                  <Button asChild>
                    <Link href="/tournaments/teams/create">
                      Create a Team
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Unregister Team Dialog */}
        <Dialog
          open={isUnregisterDialogOpen}
          onOpenChange={setIsUnregisterDialogOpen}
        >
          <DialogContent className="px-4 sm:px-6 py-4 sm:py-6">
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

        {/* Fill Tournament Confirmation Dialog */}
        <Dialog open={isFillDialogOpen} onOpenChange={setIsFillDialogOpen}>
          <DialogContent className="sm:max-w-[450px] px-4 sm:px-6 py-4 sm:py-6">
            <DialogHeader>
              <DialogTitle>Fill Tournament</DialogTitle>
              <DialogDescription>
                This will fill the tournament with random teams. This action cannot be undone.
                Are you sure you want to continue?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsFillDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="default"
                onClick={handleFillTournament}
                className="bg-primary"
              >
                Fill Tournament
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Clear Teams Confirmation Dialog */}
        <Dialog open={isClearDialogOpen} onOpenChange={setIsClearDialogOpen}>
          <DialogContent className="sm:max-w-[450px] px-4 sm:px-6 py-4 sm:py-6">
            <DialogHeader>
              <DialogTitle>Clear All Teams</DialogTitle>
              <DialogDescription>
                This will remove all teams from the tournament. This action cannot be undone.
                Are you sure you want to continue?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsClearDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleClearTournament}
              >
                Clear Teams
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
