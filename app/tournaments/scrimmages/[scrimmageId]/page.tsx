"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Loader2,
  UserCircle,
  ChevronLeft,
  Trophy,
  CheckCircle,
  Timer,
  Users,
  AlertCircle,
  MapPin,
  Shield,
  Check,
  X,
  Calendar as CalendarIcon,
  Bell,
  RefreshCw,
  Award,
  Play,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";
import { format, set } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { getRankIconPath } from "@/lib/ranks";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";

export default function ScrimmageDetailsPage({
  params,
}: {
  params: { scrimmageId: string };
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const [match, setMatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [requestChangeDialogOpen, setRequestChangeDialogOpen] = useState(false);
  const [forfeitDialogOpen, setForfeitDialogOpen] = useState(false);
  const [changeRequestDate, setChangeRequestDate] = useState<Date | undefined>(
    undefined
  );
  const [changeRequestTime, setChangeRequestTime] = useState<string>("19:00");
  const [changeRequestMessage, setChangeRequestMessage] = useState("");
  const [changeRequestLoading, setChangeRequestLoading] = useState(false);
  const [changeRequestMaps, setChangeRequestMaps] = useState<any[]>([]);
  const [maps, setMaps] = useState<any[]>([]);
  const [mapsLoading, setMapsLoading] = useState(false);
  const [mapSelectionMethod, setMapSelectionMethod] = useState<
    "manual" | "standard"
  >("manual");
  const [mapsSectionOpen, setMapsSectionOpen] = useState(false);
  const [forfeitLoading, setForfeitLoading] = useState(false);
  const [scoreSubmitDialogOpen, setScoreSubmitDialogOpen] = useState(false);
  const [currentMapIndex, setCurrentMapIndex] = useState(0);
  const [teamAScore, setTeamAScore] = useState(0);
  const [teamBScore, setTeamBScore] = useState(0);
  const [scoreSubmitLoading, setScoreSubmitLoading] = useState(false);
  const [changeRequest, setChangeRequest] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMatch = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/scrimmages/${params.scrimmageId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch match details");
      }
      const data = await response.json();
      setMatch(data);

      // Check if there's a change request
      if (data.changeRequest) {
        setChangeRequest(data.changeRequest);
      }
    } catch (error) {
      console.error("Error fetching match:", error);
      toast({
        title: "Error",
        description: "Failed to load match details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [params.scrimmageId]);

  useEffect(() => {
    if (params.scrimmageId) {
      fetchMatch();
    }
  }, [params.scrimmageId, fetchMatch]);

  useEffect(() => {
    if (match) {
      const isTeamACaptain =
        session?.user?.id === match?.challengerTeam?.captain?.discordId ||
        match?.challengerTeam?.members?.some(
          (member: any) =>
            member.discordId === session?.user?.id && member.role === "captain"
        );

      const isTeamBCaptain =
        session?.user?.id === match?.challengedTeam?.captain?.discordId ||
        match?.challengedTeam?.members?.some(
          (member: any) =>
            member.discordId === session?.user?.id && member.role === "captain"
        );
    }
  }, [match, session]);

  // Fetch maps when dialog opens
  useEffect(() => {
    if (requestChangeDialogOpen) {
      const fetchMaps = async () => {
        try {
          setMapsLoading(true);
          const response = await fetch("/api/maps");
          if (!response.ok) {
            throw new Error("Failed to fetch maps");
          }
          const data = await response.json();

          // Process maps to include small variants
          const processedMaps: any[] = [];
          data.forEach((map: any) => {
            processedMaps.push({
              _id: map._id,
              name: map.name,
              image: `/maps/map_${map.name
                .toLowerCase()
                .replace(/\s+/g, "")}.png`,
              gameMode: map.gameMode || "Standard",
              isSmallVariant: false,
              smallOption: map.smallOption,
              originalId: map._id,
            });

            if (map.smallOption) {
              processedMaps.push({
                _id: map._id,
                variant: "small",
                name: `${map.name} (Small)`,
                image: `/maps/map_${map.name
                  .toLowerCase()
                  .replace(/\s+/g, "")}.png`,
                gameMode: map.gameMode || "Standard",
                isSmallVariant: true,
                smallOption: false,
                originalId: map._id,
              });
            }
          });

          setMaps(processedMaps);
        } catch (error) {
          console.error("Error fetching maps:", error);
        } finally {
          setMapsLoading(false);
        }
      };

      fetchMaps();
    } else {
      // Reset when dialog closes
      setChangeRequestMaps([]);
      setChangeRequestDate(undefined);
      setChangeRequestTime("19:00");
      setChangeRequestMessage("");
    }
  }, [requestChangeDialogOpen]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchMatch();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <div className="container px-4 py-6 mx-auto sm:px-6 lg:px-8">
          <div className="flex gap-3 items-center mb-4">
            <Button
              variant="ghost"
              size="sm"
              className="h-9"
              onClick={() => router.push("/tournaments/scrimmages")}
            >
              <ArrowLeft className="mr-2 w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </Button>
          </div>
          <div className="space-y-8">
            <div className="flex flex-col space-y-3">
              <Skeleton className="w-3/4 h-12" />
              <Skeleton className="w-1/2 h-6" />
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <Skeleton className="h-64" />
              <Skeleton className="h-64" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!match) {
    return (
      <main className="min-h-screen bg-background">
        <div className="container px-4 py-6 mx-auto sm:px-6 lg:px-8">
          <div className="flex gap-3 items-center mb-4">
            <Button
              variant="ghost"
              size="sm"
              className="h-9"
              onClick={() => router.push("/tournaments/scrimmages")}
            >
              <ArrowLeft className="mr-2 w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </Button>
          </div>
          <Card>
            <CardContent className="flex flex-col justify-center items-center py-12">
              <AlertCircle className="mb-4 w-12 h-12 text-muted-foreground" />
              <h2 className="mb-2 text-xl font-semibold">
                Scrimmage not found
              </h2>
              <p className="mb-6 text-muted-foreground">
                The scrimmage you&apos;re looking for doesn&apos;t exist or you
                don&apos;t have permission to view it.
              </p>
              <Button asChild>
                <Link href="/tournaments/scrimmages">Back to Scrimmages</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  const isTeamACaptain =
    session?.user?.id === match?.challengerTeam?.captain?.discordId ||
    match?.challengerTeam?.members?.some(
      (member: any) =>
        member.discordId === session?.user?.id && member.role === "captain"
    );

  const isTeamBCaptain =
    session?.user?.id === match?.challengedTeam?.captain?.discordId ||
    match?.challengedTeam?.members?.some(
      (member: any) =>
        member.discordId === session?.user?.id && member.role === "captain"
    );

  const isAdmin = session?.user?.roles?.includes("admin");
  const canSubmitScores = isTeamACaptain || isTeamBCaptain || isAdmin;
  const canRequestChange =
    (isTeamACaptain || isTeamBCaptain) && match.status === "accepted";
  const canForfeit =
    (isTeamACaptain || isTeamBCaptain) && match.status === "accepted";

  // Sort team members to put captain first
  const sortTeamMembers = (team: any) => {
    if (!team || !team.members) return [];

    return [...team.members].sort((a, b) => {
      if (a.discordId === team.captain?.discordId) return -1;
      if (b.discordId === team.captain?.discordId) return 1;
      return 0;
    });
  };

  const teamAMembers = sortTeamMembers(match.challengerTeam);
  const teamBMembers = sortTeamMembers(match.challengedTeam);

  // Generate time options for the time selector (30 min intervals)
  const timeOptions = Array.from({ length: 48 }, (_, i) => {
    const hour = Math.floor(i / 2);
    const minute = (i % 2) * 30;
    const formattedHour = hour.toString().padStart(2, "0");
    const formattedMinute = minute.toString().padStart(2, "0");
    const timeValue = `${formattedHour}:${formattedMinute}`;

    // Format for display (12-hour format with AM/PM)
    const displayHour = hour % 12 || 12;
    const period = hour < 12 ? "AM" : "PM";
    const displayTime = `${displayHour}:${
      formattedMinute === "00" ? "00" : "30"
    } ${period}`;

    return { value: timeValue, label: displayTime };
  });

  // Combine date and time for the request (with timezone support)
  const getCombinedDateTime = (): string | null => {
    if (!changeRequestDate) return null;

    const [hours, minutes] = changeRequestTime.split(":").map(Number);

    // Create a date object with the selected date and time in user's local timezone
    const year = changeRequestDate.getFullYear();
    const month = changeRequestDate.getMonth();
    const day = changeRequestDate.getDate();

    // Create a new Date object with the selected date and time in user's local timezone
    const localDateTime = new Date(year, month, day, hours, minutes, 0, 0);

    // Convert to UTC ISO string for storage
    return localDateTime.toISOString();
  };

  // Handle map selection
  const handleMapSelect = (map: any) => {
    if (
      changeRequestMaps.some(
        (m) => m.id === map._id && m.isSmallVariant === map.isSmallVariant
      )
    ) {
      setChangeRequestMaps(
        changeRequestMaps.filter(
          (m) => !(m.id === map._id && m.isSmallVariant === map.isSmallVariant)
        )
      );
    } else {
      if (changeRequestMaps.length < 3) {
        setChangeRequestMaps([
          ...changeRequestMaps,
          {
            id: map._id,
            name: map.name,
            isSmallVariant: map.isSmallVariant,
            gameMode: map.gameMode,
            image: map.image,
          },
        ]);
      }
    }
  };

  const handleRequestChange = async () => {
    try {
      setChangeRequestLoading(true);

      const combinedDateTime = getCombinedDateTime();

      // Format maps for API
      const formattedMaps =
        changeRequestMaps.length > 0
          ? changeRequestMaps.map((map) => ({
              id: map.id,
              name: map.name,
              isSmallVariant: map.isSmallVariant,
              gameMode: map.gameMode,
            }))
          : null;

      const response = await fetch(
        `/api/scrimmages/${params.scrimmageId}/request-change`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            newDate: combinedDateTime,
            newTime: combinedDateTime ? null : changeRequestTime,
            newMaps: formattedMaps,
            message: changeRequestMessage,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to request change");
      }

      setRequestChangeDialogOpen(false);
      toast({
        title: "Change requested",
        description: "Your request has been sent to the other team.",
      });

      // Refresh the match data
      const updatedMatch = await response.json();
      setMatch(updatedMatch);
    } catch (error: any) {
      console.error("Error requesting change:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to request change",
        variant: "destructive",
      });
    } finally {
      setChangeRequestLoading(false);
    }
  };

  const handleForfeit = async () => {
    try {
      setForfeitLoading(true);
      const response = await fetch(
        `/api/scrimmages/${params.scrimmageId}/forfeit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to forfeit match");
      }

      setForfeitDialogOpen(false);
      toast({
        title: "Match forfeited",
        description: "Your team has forfeited the match.",
      });

      // Refresh the match data
      const updatedMatch = await response.json();
      setMatch(updatedMatch);
    } catch (error: any) {
      console.error("Error forfeiting match:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to forfeit match",
        variant: "destructive",
      });
    } finally {
      setForfeitLoading(false);
    }
  };

  const handleSubmitScore = async () => {
    // Validate scores - first to 6, no ties
    if (teamAScore === teamBScore) {
      toast({
        title: "Invalid Score",
        description: "Scores cannot be equal - one team must win (first to 6).",
        variant: "destructive",
      });
      return;
    }

    if (teamAScore !== 6 && teamBScore !== 6) {
      toast({
        title: "Invalid Score",
        description:
          "The winning team must have exactly 6 points (first to 6).",
        variant: "destructive",
      });
      return;
    }

    if (
      (teamAScore === 6 && teamBScore >= 6) ||
      (teamBScore === 6 && teamAScore >= 6)
    ) {
      toast({
        title: "Invalid Score",
        description: "The losing team must have less than 6 points.",
        variant: "destructive",
      });
      return;
    }

    try {
      setScoreSubmitLoading(true);

      const response = await fetch(
        `/api/scrimmages/${params.scrimmageId}/submit-score`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            mapIndex: currentMapIndex,
            teamAScore,
            teamBScore,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit score");
      }

      // Refresh the match data after successful submission
      await fetchMatch();

      setScoreSubmitDialogOpen(false);

      const updatedMatch = await response.json();
      const mapScore = updatedMatch.mapScores?.[currentMapIndex];

      // Check if scores matched or if there was a mismatch
      if (mapScore?.scoresMatch) {
        toast({
          title: "Score Submitted",
          description:
            "Your score has been submitted and matches the opponent's score.",
        });
      } else if (
        mapScore?.teamASubmitted &&
        mapScore?.teamBSubmitted &&
        !mapScore?.scoresMatch
      ) {
        toast({
          title: "Score Mismatch",
          description:
            "Scores don't match. Please resubmit with the correct scores.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Score Submitted",
          description:
            "Your score has been submitted. Waiting for opponent's submission.",
        });
      }
    } catch (error: any) {
      console.error("Error submitting score:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit score",
        variant: "destructive",
      });
    } finally {
      setScoreSubmitLoading(false);
    }
  };

  const openScoreSubmitDialog = (mapIndex: number) => {
    setCurrentMapIndex(mapIndex);
    setTeamAScore(0);
    setTeamBScore(0);
    setScoreSubmitDialogOpen(true);
  };

  const handleChangeRequestResponse = async (accept: boolean) => {
    try {
      const response = await fetch(
        `/api/scrimmages/${params.scrimmageId}/change-response`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            accept,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Failed to respond to change request"
        );
      }

      // Refresh the match data
      const updatedMatch = await response.json();
      setMatch(updatedMatch);
      setChangeRequest(updatedMatch.changeRequest);

      toast({
        title: accept ? "Change accepted" : "Change rejected",
        description: accept
          ? "The requested changes have been applied to the scrimmage."
          : "The change request has been rejected.",
      });
    } catch (error: any) {
      console.error("Error responding to change request:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to respond to change request",
        variant: "destructive",
      });
    }
  };

  // Add this function to check if previous maps are scored
  const canSubmitMapScore = (mapIndex: number) => {
    if (!match || !match.mapScores) return mapIndex === 0;

    // First map can always be scored
    if (mapIndex === 0) return true;

    // For subsequent maps, check if previous maps have scores that match
    for (let i = 0; i < mapIndex; i++) {
      const previousMapScore = match.mapScores[i];
      if (
        !previousMapScore ||
        !previousMapScore.scoresMatch ||
        !previousMapScore.winner
      ) {
        return false;
      }
    }

    return true;
  };

  // Helper for status badge
  const getStatusBadge = (status: string | undefined) => {
    if (!status) return null;

    switch (status.toLowerCase()) {
      case "pending":
        return (
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50 gap-1.5">
            <Clock className="w-3 h-3" />
            PENDING
          </Badge>
        );
      case "accepted":
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/50 gap-1.5">
            <CheckCircle className="w-3 h-3" />
            ACCEPTED
          </Badge>
        );
      case "completed":
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/50 gap-1.5">
            <CheckCircle className="w-3 h-3" />
            COMPLETED
          </Badge>
        );
      case "cancelled":
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/50 gap-1.5">
            <X className="w-3 h-3" />
            CANCELLED
          </Badge>
        );
      default:
        return <Badge>{status.toUpperCase()}</Badge>;
    }
  };

  // Helper for team member display
  const MemberAvatar = ({
    member,
    isCaptain,
  }: {
    member: any;
    isCaptain: boolean;
  }) => {
    return (
      <div className="flex gap-3 items-center p-2 mb-3 rounded-lg transition-colors hover:bg-muted/50">
        <div className="relative w-10 h-10 shrink-0">
          {member.discordProfilePicture ? (
            <Image
              src={member.discordProfilePicture}
              alt={member.discordNickname || member.discordUsername}
              width={40}
              height={40}
              className="object-cover rounded-full border-2 border-background"
              unoptimized
            />
          ) : (
            <div className="flex justify-center items-center w-10 h-10 rounded-full border-2 bg-muted border-background">
              <UserCircle className="w-6 h-6 text-muted-foreground" />
            </div>
          )}
          {isCaptain && (
            <div className="flex absolute -right-1 -bottom-1 justify-center items-center w-4 h-4 rounded-full border-2 bg-primary border-background">
              <Award className="w-2.5 h-2.5 text-primary-foreground" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">
            {member.discordNickname || member.discordUsername}
          </div>
          <div className="flex gap-2 items-center text-xs text-muted-foreground">
            {isCaptain && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                Captain
              </Badge>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="container px-4 py-6 mx-auto sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-6 sm:mb-8">
          <div className="flex gap-3 items-center mb-4">
            <Button
              variant="ghost"
              size="sm"
              className="h-9"
              onClick={() => router.push("/tournaments/scrimmages")}
            >
              <ArrowLeft className="mr-2 w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </Button>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap gap-3 items-center">
                <h1 className="text-2xl font-bold sm:text-3xl">
                  Scrimmage Match
                </h1>
                {match?.status && getStatusBadge(match.status)}
              </div>
              <p className="text-sm text-muted-foreground">
                {format(new Date(match.proposedDate), "EEEE, MMMM d, yyyy")} at{" "}
                {format(new Date(match.proposedDate), "h:mm a")}
              </p>
            </div>
          </div>
        </div>

        {/* Change Request Card */}
        {changeRequest && changeRequest.status === "pending" && (
          <Card className="mb-8 border-amber-500">
            <CardHeader className="bg-amber-500/10">
              <div className="flex justify-between items-center">
                <CardTitle className="flex gap-2 items-center">
                  <Bell className="w-5 h-5" />
                  Change Request
                </CardTitle>
                <Badge
                  variant="outline"
                  className="text-amber-500 border-amber-500"
                >
                  Pending
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium">Requested By</p>
                  <p className="text-sm text-muted-foreground">
                    {changeRequest.requestedByTeam === "teamA"
                      ? match.challengerTeam?.name
                      : match.challengedTeam?.name}
                  </p>
                </div>

                {changeRequest.newDate && (
                  <div>
                    <p className="text-sm font-medium">Proposed New Date</p>
                    <p className="text-sm text-muted-foreground">
                      {format(
                        new Date(changeRequest.newDate),
                        "EEEE, MMMM d, yyyy"
                      )}{" "}
                      at {format(new Date(changeRequest.newDate), "h:mm a")}
                    </p>
                  </div>
                )}

                {changeRequest.message && (
                  <div>
                    <p className="text-sm font-medium">Message</p>
                    <p className="text-sm text-muted-foreground">
                      {changeRequest.message}
                    </p>
                  </div>
                )}

                {/* Only show response buttons to the other team captain */}
                {((isTeamACaptain &&
                  changeRequest.requestedByTeam === "teamB") ||
                  (isTeamBCaptain &&
                    changeRequest.requestedByTeam === "teamA")) && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button
                      variant="default"
                      onClick={() => handleChangeRequestResponse(true)}
                    >
                      Accept Changes
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleChangeRequestResponse(false)}
                    >
                      Reject
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setRequestChangeDialogOpen(true)}
                    >
                      Propose New Date
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Teams Section - Modern Card Design */}
        <div className="grid grid-cols-1 gap-4 mb-6 sm:gap-6 lg:grid-cols-2">
          {/* Team A */}
          <Card className="overflow-hidden transition-all hover:shadow-lg hover:shadow-primary/5 hover:border-primary/30">
            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-start pb-4 mb-4 border-b">
                <div className="flex-1 min-w-0">
                  {match.challengerTeam?._id ? (
                    <Link
                      href={`/tournaments/teams/${match.challengerTeam._id}`}
                      className="flex gap-2 items-center mb-1 text-xl font-bold truncate transition-colors sm:text-2xl hover:text-primary"
                    >
                      {match.challengerTeam.name || "Team A"}
                      <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground shrink-0" />
                    </Link>
                  ) : (
                    <h2 className="mb-1 text-xl font-bold truncate sm:text-2xl">
                      {match.challengerTeam?.name || "Team A"}
                    </h2>
                  )}
                  <div className="flex flex-wrap gap-2 items-center">
                    {match.challengerTeam?.tag && (
                      <Badge variant="outline" className="text-xs">
                        [{match.challengerTeam.tag}]
                      </Badge>
                    )}
                    {match.challengerTeam?.teamElo && (
                      <Badge variant="secondary" className="text-xs">
                        {match.challengerTeam.teamElo.toLocaleString()} ELO
                      </Badge>
                    )}
                    {match.teamSize && (
                      <Badge variant="secondary" className="text-xs">
                        {match.teamSize === 2
                          ? "2v2"
                          : match.teamSize === 3
                          ? "3v3"
                          : match.teamSize === 4
                          ? "4v4"
                          : match.teamSize === 5
                          ? "5v5"
                          : `${match.teamSize}v${match.teamSize}`}
                      </Badge>
                    )}
                  </div>
                </div>
                <Badge className="bg-blue-600 shrink-0">TEAM 1</Badge>
              </div>

              <div className="mt-4">
                <h3 className="flex gap-2 items-center mb-3 text-sm font-semibold">
                  <Users className="w-4 h-4" />
                  Team Members
                </h3>

                {/* Captain with null check */}
                {match.challengerTeam?.captain && (
                  <MemberAvatar
                    member={match.challengerTeam.captain}
                    isCaptain={true}
                  />
                )}

                {/* Other members with null checks */}
                {match.challengerTeam?.members &&
                  match.challengerTeam.members
                    .filter(
                      (m: any) =>
                        m.discordId !== match.challengerTeam?.captain?.discordId
                    )
                    .map((member: any) => (
                      <MemberAvatar
                        key={member.discordId}
                        member={member}
                        isCaptain={false}
                      />
                    ))}
              </div>
            </div>
          </Card>

          {/* Team B */}
          <Card className="overflow-hidden transition-all hover:shadow-lg hover:shadow-primary/5 hover:border-primary/30">
            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-start pb-4 mb-4 border-b">
                <div className="flex-1 min-w-0">
                  {match.challengedTeam?._id ? (
                    <Link
                      href={`/tournaments/teams/${match.challengedTeam._id}`}
                      className="flex gap-2 items-center mb-1 text-xl font-bold truncate transition-colors sm:text-2xl hover:text-primary"
                    >
                      {match.challengedTeam.name || "Team B"}
                      <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground shrink-0" />
                    </Link>
                  ) : (
                    <h2 className="mb-1 text-xl font-bold truncate sm:text-2xl">
                      {match.challengedTeam?.name || "Team B"}
                    </h2>
                  )}
                  <div className="flex flex-wrap gap-2 items-center">
                    {match.challengedTeam?.tag && (
                      <Badge variant="outline" className="text-xs">
                        [{match.challengedTeam.tag}]
                      </Badge>
                    )}
                    {match.challengedTeam?.teamElo && (
                      <Badge variant="secondary" className="text-xs">
                        {match.challengedTeam.teamElo.toLocaleString()} ELO
                      </Badge>
                    )}
                    {match.teamSize && (
                      <Badge variant="secondary" className="text-xs">
                        {match.teamSize === 2
                          ? "2v2"
                          : match.teamSize === 3
                          ? "3v3"
                          : match.teamSize === 4
                          ? "4v4"
                          : match.teamSize === 5
                          ? "5v5"
                          : `${match.teamSize}v${match.teamSize}`}
                      </Badge>
                    )}
                  </div>
                </div>
                <Badge className="bg-red-600 shrink-0">TEAM 2</Badge>
              </div>

              <div className="mt-4">
                <h3 className="flex gap-2 items-center mb-3 text-sm font-semibold">
                  <Users className="w-4 h-4" />
                  Team Members
                </h3>

                {/* Captain with null check */}
                {match.challengedTeam?.captain && (
                  <MemberAvatar
                    member={match.challengedTeam.captain}
                    isCaptain={true}
                  />
                )}

                {/* Other members with null checks */}
                {match.challengedTeam?.members &&
                  match.challengedTeam.members
                    .filter(
                      (m: any) =>
                        m.discordId !== match.challengedTeam?.captain?.discordId
                    )
                    .map((member: any) => (
                      <MemberAvatar
                        key={member.discordId}
                        member={member}
                        isCaptain={false}
                      />
                    ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Maps Section */}
        <div className="mb-8">
          <div className="flex gap-2 items-center mb-6">
            <div className="p-2 rounded-md border bg-primary/10 border-primary/20">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-2xl font-bold sm:text-3xl">Match Maps</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {match.selectedMaps && match.selectedMaps.length > 0 ? (
              match.selectedMaps.map((map: any, index: number) => {
                const mapScore = match.mapScores?.[index];
                const scoresMatch = mapScore?.scoresMatch === true;
                const bothTeamsSubmitted =
                  mapScore?.teamASubmitted && mapScore?.teamBSubmitted;
                const mapNumber = index + 1;

                // Determine if current user's team has submitted
                const userTeamSubmitted = isTeamACaptain
                  ? mapScore?.teamASubmitted
                  : isTeamBCaptain
                  ? mapScore?.teamBSubmitted
                  : false;

                // Determine if opponent team has submitted
                const opponentTeamSubmitted = isTeamACaptain
                  ? mapScore?.teamBSubmitted
                  : isTeamBCaptain
                  ? mapScore?.teamASubmitted
                  : false;

                const isTeamAWinner = mapScore?.winner === "teamA";
                const isTeamBWinner = mapScore?.winner === "teamB";

                return (
                  <Card
                    key={index}
                    className={cn(
                      "overflow-hidden transition-all hover:shadow-lg",
                      isTeamAWinner && "border-blue-500/50 bg-blue-500/5",
                      isTeamBWinner && "border-red-500/50 bg-red-500/5"
                    )}
                  >
                    {/* Map Image */}
                    <div className="relative h-40 sm:h-48">
                      {map.image ? (
                        <Image
                          src={map.image}
                          alt={map.name}
                          fill
                          priority={index === 0}
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      ) : (
                        <div className="flex justify-center items-center h-full">
                          <MapPin className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                      {mapScore?.winner && (
                        <div className="absolute top-2 right-2">
                          <Badge
                            className={cn(
                              "gap-1",
                              isTeamAWinner && "bg-blue-600",
                              isTeamBWinner && "bg-red-600"
                            )}
                          >
                            <Award className="w-3 h-3" />
                            {isTeamAWinner
                              ? match.challengerTeam?.name || "Team A"
                              : match.challengedTeam?.name || "Team B"}{" "}
                            Won
                          </Badge>
                        </div>
                      )}
                    </div>

                    {/* Map Info */}
                    <div className="p-4 sm:p-5">
                      <div className="mb-4">
                        <h3 className="mb-1 text-lg font-bold sm:text-xl">
                          {map.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {map.gameMode}
                        </p>
                      </div>

                      {/* Scores - Only show when both teams have submitted matching scores (scoresMatch is true) */}
                      <div className="p-3 mb-4 rounded-lg bg-muted/50">
                        {scoresMatch &&
                        mapScore?.teamAScore !== null &&
                        mapScore?.teamBScore !== null ? (
                          <>
                            <div
                              className={cn(
                                "flex items-center justify-between mb-2 p-2 rounded",
                                isTeamAWinner && "bg-blue-500/10"
                              )}
                            >
                              <span className="flex-1 text-sm font-medium truncate">
                                {match.challengerTeam?.name || "Team A"}
                              </span>
                              <span className="ml-2 text-2xl font-bold shrink-0">
                                {mapScore.teamAScore}
                              </span>
                            </div>
                            <div
                              className={cn(
                                "flex items-center justify-between p-2 rounded",
                                isTeamBWinner && "bg-red-500/10"
                              )}
                            >
                              <span className="flex-1 text-sm font-medium truncate">
                                {match.challengedTeam?.name || "Team B"}
                              </span>
                              <span className="ml-2 text-2xl font-bold shrink-0">
                                {mapScore.teamBScore}
                              </span>
                            </div>
                          </>
                        ) : (
                          <div className="py-4 text-center">
                            <p className="text-sm text-muted-foreground">
                              {bothTeamsSubmitted && !scoresMatch
                                ? "Scores don't match - please resubmit"
                                : mapScore?.teamASubmitted ||
                                  mapScore?.teamBSubmitted
                                ? "Waiting for both teams to submit scores"
                                : "No scores submitted yet"}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Verification Status */}
                      <div className="flex justify-between mb-4 text-xs">
                        <div
                          className={cn(
                            "flex items-center gap-1.5 px-2 py-1 rounded",
                            mapScore?.teamASubmitted && scoresMatch
                              ? "text-green-500 bg-green-500/10"
                              : mapScore?.teamASubmitted && !scoresMatch
                              ? "text-yellow-500 bg-yellow-500/10"
                              : "text-muted-foreground bg-muted"
                          )}
                        >
                          {mapScore?.teamASubmitted && scoresMatch ? (
                            <CheckCircle className="w-3.5 h-3.5" />
                          ) : mapScore?.teamASubmitted && !scoresMatch ? (
                            <CheckCircle className="w-3.5 h-3.5" />
                          ) : (
                            <X className="w-3.5 h-3.5" />
                          )}
                          <span>
                            Team 1
                            {mapScore?.teamASubmitted &&
                              !scoresMatch &&
                              " (Submitted)"}
                          </span>
                        </div>
                        <div
                          className={cn(
                            "flex items-center gap-1.5 px-2 py-1 rounded",
                            mapScore?.teamBSubmitted && scoresMatch
                              ? "text-green-500 bg-green-500/10"
                              : mapScore?.teamBSubmitted && !scoresMatch
                              ? "text-yellow-500 bg-yellow-500/10"
                              : "text-muted-foreground bg-muted"
                          )}
                        >
                          {mapScore?.teamBSubmitted && scoresMatch ? (
                            <CheckCircle className="w-3.5 h-3.5" />
                          ) : mapScore?.teamBSubmitted && !scoresMatch ? (
                            <CheckCircle className="w-3.5 h-3.5" />
                          ) : (
                            <X className="w-3.5 h-3.5" />
                          )}
                          <span>
                            Team 2
                            {mapScore?.teamBSubmitted &&
                              !scoresMatch &&
                              " (Submitted)"}
                          </span>
                        </div>
                      </div>

                      {/* Submit Score Button */}
                      {canSubmitScores &&
                        match.status === "accepted" &&
                        !scoresMatch && (
                          <Button
                            className="w-full h-9 text-sm"
                            onClick={() => {
                              setCurrentMapIndex(index);
                              setTeamAScore(0);
                              setTeamBScore(0);
                              setScoreSubmitDialogOpen(true);
                            }}
                            disabled={!canSubmitMapScore(index)}
                          >
                            {canSubmitMapScore(index)
                              ? userTeamSubmitted && !scoresMatch
                                ? "Resubmit Score"
                                : "Submit Score"
                              : "Score Previous Maps First"}
                          </Button>
                        )}
                    </div>
                  </Card>
                );
              })
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                No maps selected for this match
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        {match.status === "accepted" && (
          <div className="flex flex-wrap gap-4">
            {(isTeamACaptain || isTeamBCaptain) && (
              <Button
                variant="outline"
                onClick={() => setRequestChangeDialogOpen(true)}
              >
                Request Change
              </Button>
            )}
            {canForfeit && (
              <Button
                variant="destructive"
                onClick={() => setForfeitDialogOpen(true)}
              >
                Forfeit Match
              </Button>
            )}
          </div>
        )}

        {/* Request Change Dialog */}
        <Dialog
          open={requestChangeDialogOpen}
          onOpenChange={setRequestChangeDialogOpen}
        >
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <DialogHeader>
              <DialogTitle>Request Match Change</DialogTitle>
              <DialogDescription>
                Request a change to the match details. The other team will need
                to approve your request.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              {/* Date and Time Section */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="date">New Date (Optional)</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="justify-start w-full font-normal text-left"
                      >
                        <CalendarIcon className="mr-2 w-4 h-4" />
                        {changeRequestDate ? (
                          format(changeRequestDate, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0 w-auto">
                      <Calendar
                        mode="single"
                        selected={changeRequestDate}
                        onSelect={(date) => setChangeRequestDate(date)}
                        disabled={(date) => {
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          return date < today;
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time">New Time</Label>
                  <Select
                    value={changeRequestTime}
                    onValueChange={setChangeRequestTime}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a time" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Your local timezone:{" "}
                    <span className="font-medium">
                      {Intl.DateTimeFormat().resolvedOptions().timeZone}
                    </span>
                  </p>
                </div>
              </div>

              {/* Map Selection Section - Collapsible */}
              <Collapsible
                open={mapsSectionOpen}
                onOpenChange={setMapsSectionOpen}
              >
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex justify-between items-center p-0 w-full h-auto font-normal"
                  >
                    <div className="flex gap-2 items-center">
                      <MapPin className="w-4 h-4 text-primary" />
                      <Label className="cursor-pointer">
                        New Maps (Optional)
                      </Label>
                    </div>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 transition-transform",
                        mapsSectionOpen && "rotate-180"
                      )}
                    />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-4 space-y-4">
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant={
                          mapSelectionMethod === "standard"
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        onClick={() => {
                          setMapSelectionMethod("standard");
                          // Find the standard maps: Nerve Center (Small), Lobby (Small), and Power Station
                          const nerveCenterSmall = maps.find(
                            (map) => map.name === "Nerve Center (Small)"
                          );
                          const lobbySmall = maps.find(
                            (map) => map.name === "Lobby (Small)"
                          );
                          const powerStation = maps.find(
                            (map) =>
                              map.name === "Power Station" &&
                              !map.isSmallVariant
                          );

                          if (nerveCenterSmall && lobbySmall && powerStation) {
                            setChangeRequestMaps([
                              {
                                id: nerveCenterSmall._id,
                                name: nerveCenterSmall.name,
                                isSmallVariant: true,
                                gameMode: nerveCenterSmall.gameMode || "",
                                image: nerveCenterSmall.image,
                              },
                              {
                                id: lobbySmall._id,
                                name: lobbySmall.name,
                                isSmallVariant: true,
                                gameMode: lobbySmall.gameMode || "",
                                image: lobbySmall.image,
                              },
                              {
                                id: powerStation._id,
                                name: powerStation.name,
                                isSmallVariant: false,
                                gameMode: powerStation.gameMode || "",
                                image: powerStation.image,
                              },
                            ]);
                          } else {
                            toast({
                              title: "Standard maps not found",
                              description:
                                "Some standard maps could not be found. Please select maps manually.",
                              variant: "default",
                            });
                          }
                        }}
                        disabled={mapsLoading}
                      >
                        Standard
                      </Button>
                      <Button
                        variant={
                          mapSelectionMethod === "manual"
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        onClick={() => {
                          setMapSelectionMethod("manual");
                          setChangeRequestMaps([]);
                        }}
                        disabled={mapsLoading}
                      >
                        Manual
                      </Button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-3 rounded-lg border bg-muted/50">
                    <span className="text-sm font-medium">Selected Maps:</span>
                    <Badge
                      variant={
                        changeRequestMaps.length === 3 ? "default" : "secondary"
                      }
                      className="text-xs"
                    >
                      {changeRequestMaps.length}/3
                    </Badge>
                  </div>

                  {mapsLoading ? (
                    <div className="flex justify-center items-center py-8">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-3 max-h-[300px] overflow-y-auto pr-2">
                      {maps.map((map) => (
                        <div
                          key={map._id + (map.isSmallVariant ? ":small" : "")}
                          onClick={() => handleMapSelect(map)}
                          className={cn(
                            "relative flex flex-col items-center border rounded-md overflow-hidden cursor-pointer transition-all",
                            changeRequestMaps.some(
                              (m) =>
                                m.id === map._id &&
                                m.isSmallVariant === map.isSmallVariant
                            )
                              ? "border-primary ring-2 ring-primary ring-opacity-50"
                              : "hover:border-primary/50"
                          )}
                        >
                          <div className="relative w-full aspect-square bg-black/40">
                            {map.image ? (
                              <Image
                                src={map.image}
                                alt={map.name}
                                className="object-cover w-full h-full"
                                width={100}
                                height={100}
                              />
                            ) : (
                              <div className="flex justify-center items-center w-full h-full bg-muted">
                                <MapPin className="w-8 h-8 text-muted-foreground" />
                              </div>
                            )}
                            {changeRequestMaps.some(
                              (m) =>
                                m.id === map._id &&
                                m.isSmallVariant === map.isSmallVariant
                            ) && (
                              <div className="flex absolute inset-0 justify-center items-center bg-primary/20">
                                <Check className="w-8 h-8 text-primary" />
                              </div>
                            )}
                          </div>
                          <div className="p-2 w-full text-center">
                            <p className="h-10 text-xs font-medium break-words line-clamp-2">
                              {map.name}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>

              {/* Message Section */}
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  placeholder="Explain why you're requesting a change..."
                  value={changeRequestMessage}
                  onChange={(e) => setChangeRequestMessage(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setRequestChangeDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleRequestChange}
                disabled={
                  changeRequestLoading ||
                  (!changeRequestDate &&
                    !changeRequestMessage &&
                    changeRequestMaps.length === 0)
                }
              >
                {changeRequestLoading ? (
                  <>
                    <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Request"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Forfeit Confirmation Dialog */}
        <AlertDialog
          open={forfeitDialogOpen}
          onOpenChange={setForfeitDialogOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Forfeit Match</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to forfeit this match? Your team will
                receive a 0-2 loss. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleForfeit}
                disabled={forfeitLoading}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {forfeitLoading ? (
                  <>
                    <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                    Forfeiting...
                  </>
                ) : (
                  "Yes, Forfeit Match"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Score Submit Dialog */}
        <Dialog
          open={scoreSubmitDialogOpen}
          onOpenChange={setScoreSubmitDialogOpen}
        >
          <DialogContent className="p-6">
            <DialogHeader>
              <DialogTitle>Submit Map Score</DialogTitle>
              <DialogDescription>
                Enter the final score for{" "}
                {match.selectedMaps &&
                  match.selectedMaps[currentMapIndex]?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="teamAScore">
                  {match.challengerTeam?.name || "Team A"} Score
                </Label>
                <Input
                  id="teamAScore"
                  type="number"
                  min="0"
                  max="6"
                  value={teamAScore}
                  onChange={(e) => setTeamAScore(parseInt(e.target.value) || 0)}
                />
                <p className="text-xs text-muted-foreground">
                  First to 6 rounds wins the map
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="teamBScore">
                  {match.challengedTeam?.name || "Team B"} Score
                </Label>
                <Input
                  id="teamBScore"
                  type="number"
                  min="0"
                  max="6"
                  value={teamBScore}
                  onChange={(e) => setTeamBScore(parseInt(e.target.value) || 0)}
                />
                <p className="text-xs text-muted-foreground">
                  First to 6 rounds wins the map
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setScoreSubmitDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleSubmitScore} disabled={scoreSubmitLoading}>
                {scoreSubmitLoading ? (
                  <>
                    <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Score"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </main>
  );
}
