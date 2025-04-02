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
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { getRankIconPath } from "@/lib/ranks";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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
  const [changeRequestMessage, setChangeRequestMessage] = useState("");
  const [changeRequestLoading, setChangeRequestLoading] = useState(false);
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

      console.log("Captain check:", {
        sessionUserId: session?.user?.id,
        isTeamACaptain,
        isTeamBCaptain,
        challengerCaptainId: match?.challengerTeam?.captain?.discordId,
        challengedCaptainId: match?.challengedTeam?.captain?.discordId,
        challengerTeamMembers: match?.challengerTeam?.members?.map(
          (m: any) => ({
            id: m.discordId,
            role: m.role,
          })
        ),
        challengedTeamMembers: match?.challengedTeam?.members?.map(
          (m: any) => ({
            id: m.discordId,
            role: m.role,
          })
        ),
      });
    }
  }, [match, session]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchMatch();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? (
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-1" />
            )}
            Refresh
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
    );
  }

  if (!match) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? (
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-1" />
            )}
            Refresh
          </Button>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="w-12 h-12 mb-4 text-muted-foreground" />
            <h2 className="mb-2 text-xl font-semibold">Scrimmage not found</h2>
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

  const handleRequestChange = async () => {
    try {
      setChangeRequestLoading(true);
      const response = await fetch(
        `/api/scrimmages/${params.scrimmageId}/request-change`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            newDate: changeRequestDate ? changeRequestDate.toISOString() : null,
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

      toast({
        title: "Score Submitted",
        description: "Your score has been submitted successfully.",
      });
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

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/tournaments/scrimmages">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Return to Scrimmages
          </Link>
        </Button>
      </div>

      <div className="flex flex-col mb-6 space-y-2">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">
            {match.challengerTeam?.name || "Team A"} vs{" "}
            {match.challengedTeam?.name || "Team B"}
          </h1>
          <Badge
            variant={
              match.status === "accepted"
                ? "default"
                : match.status === "completed"
                ? "success"
                : "secondary"
            }
          >
            {match.status.charAt(0).toUpperCase() + match.status.slice(1)}
          </Badge>
        </div>
        <p className="text-muted-foreground">
          {format(new Date(match.proposedDate), "EEEE, MMMM d, yyyy")}
        </p>
      </div>

      {/* Match Details Card - Moved to the top */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Match Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Date & Time</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(match.proposedDate), "EEEE, MMMM d, yyyy")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Time</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(match.proposedDate), "h:mm a")}
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <p className="mb-2 text-sm font-medium">Match Status</p>
                <Badge
                  variant={
                    match.status === "accepted"
                      ? "default"
                      : match.status === "completed"
                      ? "success"
                      : "secondary"
                  }
                >
                  {match.status === "accepted"
                    ? "Match Scheduled"
                    : match.status.charAt(0).toUpperCase() +
                      match.status.slice(1)}
                </Badge>
              </div>
              {match.message && (
                <div>
                  <p className="mb-1 text-sm font-medium">Message</p>
                  <p className="text-sm text-muted-foreground">
                    {match.message}
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Change Request Card */}
      {changeRequest && changeRequest.status === "pending" && (
        <Card className="mb-8 border-amber-500">
          <CardHeader className="bg-amber-500/10">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
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
              {((isTeamACaptain && changeRequest.requestedByTeam === "teamB") ||
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

      {/* Team Cards */}
      <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-2">
        {/* Team A Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              {match.challengerTeam?.name || "Team A"}
              {match.challengerTeam?.tag && (
                <span className="text-sm text-muted-foreground">
                  [{match.challengerTeam.tag}]
                </span>
              )}
            </CardTitle>
            <CardDescription>Challenging Team</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="mb-2 text-sm font-medium">Team Members</h3>
                {teamAMembers.length > 0 ? (
                  <div className="space-y-2">
                    {teamAMembers.map((member: any) => (
                      <div
                        key={member.discordId}
                        className="flex items-center gap-2 p-2 rounded-md "
                      >
                        <Avatar className="w-8 h-8">
                          {member.discordProfilePicture ? (
                            <AvatarImage
                              src={member.discordProfilePicture}
                              alt={member.discordUsername}
                            />
                          ) : (
                            <AvatarFallback>
                              {member.discordUsername?.charAt(0) || "U"}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {member.discordNickname || member.discordUsername}
                          </p>
                          {member.discordId ===
                            match.challengerTeam?.captain?.discordId && (
                            <Badge variant="outline" className="text-xs">
                              Captain
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No team members
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Team B Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              {match.challengedTeam?.name || "Team B"}
              {match.challengedTeam?.tag && (
                <span className="text-sm text-muted-foreground">
                  [{match.challengedTeam.tag}]
                </span>
              )}
            </CardTitle>
            <CardDescription>Challenged Team</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="mb-2 text-sm font-medium">Team Members</h3>
                {teamBMembers.length > 0 ? (
                  <div className="space-y-2">
                    {teamBMembers.map((member: any) => (
                      <div
                        key={member.discordId}
                        className="flex items-center gap-2 p-2 rounded-md "
                      >
                        <Avatar className="w-8 h-8">
                          {member.discordProfilePicture ? (
                            <AvatarImage
                              src={member.discordProfilePicture}
                              alt={member.discordUsername}
                            />
                          ) : (
                            <AvatarFallback>
                              {member.discordUsername?.charAt(0) || "U"}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {member.discordNickname || member.discordUsername}
                          </p>
                          {member.discordId ===
                            match.challengedTeam?.captain?.discordId && (
                            <Badge variant="outline" className="text-xs">
                              Captain
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No team members
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Maps Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Match Maps</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {match.selectedMaps && match.selectedMaps.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {match.selectedMaps.map((map: any, index: number) => {
                  const mapScore = match.mapScores?.[index];
                  const bothTeamsSubmitted =
                    mapScore?.teamASubmitted && mapScore?.teamBSubmitted;
                  const mapNumber = index + 1;

                  return (
                    <div
                      key={index}
                      className="relative overflow-hidden border rounded-lg shadow bg-card text-card-foreground"
                    >
                      <div className="p-2 font-medium text-center bg-muted/50">
                        Map {mapNumber}
                      </div>
                      <div className="relative aspect-video">
                        {map.image ? (
                          <Image
                            src={map.image}
                            alt={map.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <MapPin className="w-8 h-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <div className="flex flex-col space-y-1.5">
                          <h3 className="text-lg font-semibold">{map.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {map.gameMode}
                          </p>
                        </div>

                        <div className="mt-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">
                              {match.challengerTeam?.name || "Team 1"}
                            </span>
                            <span className="text-xl font-bold">
                              {bothTeamsSubmitted ? mapScore?.teamAScore : "0"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="font-medium">
                              {match.challengedTeam?.name || "Team 2"}
                            </span>
                            <span className="text-xl font-bold">
                              {bothTeamsSubmitted ? mapScore?.teamBScore : "0"}
                            </span>
                          </div>
                        </div>

                        {bothTeamsSubmitted && mapScore?.winner && (
                          <div className="flex items-center gap-1 mt-2 text-sm text-green-500">
                            <Trophy className="w-4 h-4" />
                            <span>
                              {mapScore.winner === "teamA"
                                ? match.challengerTeam?.name
                                : match.challengedTeam?.name}{" "}
                              wins
                            </span>
                          </div>
                        )}

                        {!bothTeamsSubmitted && (
                          <div className="mt-2 text-sm text-muted-foreground">
                            {mapScore?.teamASubmitted && "Team 1 submitted"}
                            {!mapScore?.teamASubmitted &&
                              !mapScore?.teamBSubmitted &&
                              "No scores yet"}
                            {mapScore?.teamBSubmitted && "Team 2 submitted"}
                          </div>
                        )}

                        {canSubmitScores && match.status === "accepted" && (
                          <Button
                            className="w-full mt-4"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setCurrentMapIndex(index);
                              setTeamAScore(0);
                              setTeamBScore(0);
                              setScoreSubmitDialogOpen(true);
                            }}
                          >
                            Submit Score
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                No maps selected for this match
              </div>
            )}
          </div>
        </CardContent>
      </Card>

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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Match Change</DialogTitle>
            <DialogDescription>
              Request a change to the match details. The other team will need to
              approve your request.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="date">New Date (Optional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="justify-start w-full font-normal text-left"
                  >
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    {changeRequestDate ? (
                      format(changeRequestDate, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={changeRequestDate}
                    onSelect={(date) => setChangeRequestDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Explain why you're requesting a change..."
                value={changeRequestMessage}
                onChange={(e) => setChangeRequestMessage(e.target.value)}
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
                (!changeRequestDate && !changeRequestMessage)
              }
            >
              {changeRequestLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
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
      <AlertDialog open={forfeitDialogOpen} onOpenChange={setForfeitDialogOpen}>
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
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Map Score</DialogTitle>
            <DialogDescription>
              Enter the final score for{" "}
              {match.selectedMaps && match.selectedMaps[currentMapIndex]?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="teamAScore">
                {match.challengerTeam?.name || "Team A"} Score
              </Label>
              <Input
                id="teamAScore"
                type="number"
                min="0"
                max="10"
                value={teamAScore}
                onChange={(e) => setTeamAScore(parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="teamBScore">
                {match.challengedTeam?.name || "Team B"} Score
              </Label>
              <Input
                id="teamBScore"
                type="number"
                min="0"
                max="10"
                value={teamBScore}
                onChange={(e) => setTeamBScore(parseInt(e.target.value) || 0)}
              />
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
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
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
  );
}
