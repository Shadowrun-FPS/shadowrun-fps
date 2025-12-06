"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Shield,
  Users,
  Trophy,
  TrendingUp,
  Settings,
  Mail,
  Loader2,
  UserMinus,
  LogIn,
  X,
  RefreshCw,
  ArrowLeft,
  UserPlus,
  AlertCircle,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TeamSettingsForm } from "@/components/teams/team-settings-form";
import { TeamInvites } from "@/components/teams/team-invites";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { TeamInvitesList } from "@/components/teams/team-invites-list";
import { useRouter } from "next/navigation";
import TeamHeader from "./team-header";
import { RequestJoinTeam } from "@/components/teams/request-join-team";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SECURITY_CONFIG } from "@/lib/security-config";
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

interface TeamMember {
  discordId: string;
  discordNickname: string;
  discordUsername?: string;
  role: string;
  discordProfilePicture?: string;
}

interface Team {
  wins: number | undefined;
  losses: number | undefined;
  _id: string;
  name: string;
  tag: string;
  description: string;
  teamSize?: number;
  captain: {
    discordProfilePicture: any;
    discordId: string;
    discordNickname: string;
  };
  members: TeamMember[];
  teamElo: number;
  createdAt?: string;
}

export default function TeamPage({ params }: { params: { teamId: string } }) {
  const { data: session } = useSession();
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [newCaptainId, setNewCaptainId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [isRefreshingElo, setIsRefreshingElo] = useState(false);
  const [userCurrentTeam, setUserCurrentTeam] = useState<Team | null>(null);
  const [memberToRemove, setMemberToRemove] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showTransferCaptainDialog, setShowTransferCaptainDialog] =
    useState(false);
  const router = useRouter();
  const fetchTeamRef = useRef(false);
  const checkUserTeamRef = useRef(false);

  const isTeamCaptain = session?.user?.id === team?.captain.discordId;

  useEffect(() => {
    // Prevent duplicate calls from React StrictMode
    if (fetchTeamRef.current) return;
    fetchTeamRef.current = true;

    const fetchTeam = async () => {
      try {
        // Check if the teamId is a valid MongoDB ObjectId (24 hex characters)
        const isObjectId = /^[0-9a-fA-F]{24}$/.test(params.teamId);

        // Use the appropriate endpoint based on whether teamId is an ObjectId or tag
        const endpoint = isObjectId
          ? `/api/teams/${params.teamId}`
          : `/api/teams/tag/${params.teamId}`;

        const response = await fetch(endpoint);
        if (!response.ok) {
          if (response.status === 429) {
            // Rate limited - wait and retry once
            await new Promise((resolve) => setTimeout(resolve, 1000));
            const retryResponse = await fetch(endpoint);
            if (!retryResponse.ok) throw new Error("Failed to load team data");
            const retryData = await retryResponse.json();
            setTeam(retryData);
          } else {
            throw new Error("Failed to load team data");
          }
        } else {
          const data = await response.json();
          setTeam(data);
        }
        // Team ELO is automatically recalculated server-side when fetching team data
      } catch (error) {
        console.error("Failed to fetch team:", error);
        toast({
          title: "Error",
          description: "Failed to load team data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTeam();
  }, [params.teamId, toast]);

  useEffect(() => {
    const checkJoinRequest = async () => {
      if (!session?.user?.id || !team) return;

      const isMember = team.members.some(
        (m) => m.discordId === session.user.id
      );
      if (isMember) return;

      try {
        const response = await fetch(
          `/api/teams/${team._id}/join-requests?userId=${session.user.id}`
        );
        if (response.ok) {
          const data = await response.json();
          setHasPendingRequest(data.hasPendingRequest);
        }
      } catch (error) {
        console.error("Failed to check join request status:", error);
      }
    };

    if (team && session?.user?.id) {
      checkJoinRequest();
    }
  }, [team, session?.user?.id]);

  useEffect(() => {
    if (team) {
      // Log team size for debugging
      // console.log(`Team ${team.name} has ${team.members.length} total members`);
      // console.log(
      //   `Invite section should be ${
      //     team.members.length < 4 ? "VISIBLE" : "HIDDEN"
      //   }`
      // );
    }
  }, [team]);

  // Add function to check if user is already in a team
  useEffect(() => {
    // Prevent duplicate calls from React StrictMode
    if (checkUserTeamRef.current || !session?.user) return;
    checkUserTeamRef.current = true;

    const checkUserTeam = async () => {
      try {
        const response = await fetch("/api/teams/my-team");
        if (response.ok) {
          const data = await response.json();
          if (data.team) {
            setUserCurrentTeam(data.team);
          }
        } else if (response.status === 429) {
          // Rate limited - skip this call
          console.warn("Rate limited on user team check");
        }
      } catch (error) {
        console.error("Error checking user team:", error);
      }
    };

    checkUserTeam();
  }, [session]);

  // Function to handle captain transfer
  const handleTransferCaptain = async () => {
    if (!newCaptainId) {
      toast({
        title: "Error",
        description: "Please select a team member first",
        variant: "destructive",
      });
      return;
    }

    // Show confirmation dialog instead of using confirm()
    setShowTransferCaptainDialog(true);
  };

  // Function to confirm and execute captain transfer
  const confirmTransferCaptain = async () => {
    if (!newCaptainId) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/teams/${team?._id}/transfer-captain`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ newCaptainId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to transfer captain role");
      }

      setShowTransferCaptainDialog(false);
      toast({
        title: "Success",
        description: "Captain role transferred successfully",
      });

      // Reload the page to show new captain
      window.location.reload();
    } catch (error: any) {
      console.error("Transfer captain error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to transfer captain role",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to handle member removal
  const handleRemoveMemberClick = (memberId: string, memberName: string) => {
    if (!isTeamCaptain) {
      toast({
        title: "Permission Denied",
        description: "Only the team captain can remove members",
        variant: "destructive",
        duration: 2000,
      });
      return;
    }
    setMemberToRemove({ id: memberId, name: memberName });
    setShowRemoveDialog(true);
  };

  const handleRemoveMember = async () => {
    if (!memberToRemove || !team) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/teams/${team._id}/remove-member`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ memberId: memberToRemove.id }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to remove team member");
      }

      toast({
        title: "Success",
        description: `${memberToRemove.name} has been removed from the team`,
        duration: 2000,
      });

      setShowRemoveDialog(false);
      setMemberToRemove(null);

      // Reload the page to reflect changes
      window.location.reload();
    } catch (error: any) {
      console.error("Error removing member:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to remove team member",
        variant: "destructive",
        duration: 2000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fix date formatting issue when signed out
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid date";
    }
  };

  // Add this function to the team details page
  const handleRefreshElo = async () => {
    if (!team) return; // Early return if team is null

    try {
      setIsRefreshingElo(true);
      const response = await fetch(`/api/teams/${team._id}/refresh-elo`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          // Add a flag to indicate this is an admin or special user request
          isAdminRequest:
            session?.user?.id === SECURITY_CONFIG.DEVELOPER_ID ||
            (Array.isArray(session?.user?.roles) &&
              session?.user?.roles.includes("admin")),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to refresh team ELO");
      }

      const data = await response.json();

      // Update the team ELO in the UI with proper type handling
      setTeam((prevTeam) => {
        if (!prevTeam) return null;
        return {
          ...prevTeam,
          teamElo: data.teamElo,
        };
      });

      toast({
        title: "Success",
        description: "Team ELO refreshed successfully",
      });
    } catch (error: any) {
      console.error("Refresh ELO error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to refresh team ELO",
        variant: "destructive",
      });
    } finally {
      setIsRefreshingElo(false);
    }
  };

  // Add this check to determine if the user can refresh ELO
  const canRefreshElo = () => {
    if (!session?.user?.id) return false;

    // Allow team captain
    if (isTeamCaptain) return true;

    // Allow specific admin user (you)
    if (session.user.id === SECURITY_CONFIG.DEVELOPER_ID) return true;

    // Allow users with admin roles
    return (
      Array.isArray(session.user.roles) && session.user.roles.includes("admin")
    );
  };

  // Add this function to the TeamPage component
  const handleDeleteTeam = async () => {
    if (!isTeamCaptain || !team) {
      toast({
        title: "Permission Denied",
        description: "Only the team captain can delete the team",
        variant: "destructive",
      });
      return;
    }

    // Check if there are other members
    const hasOtherMembers =
      team.members.filter((m) => m.discordId !== session?.user?.id).length > 0;
    if (hasOtherMembers) {
      toast({
        title: "Cannot Delete Team",
        description:
          "You must remove all other members before deleting the team",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/teams/${team._id}/delete`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete team");
      }

      toast({
        title: "Team Deleted",
        description: "Your team has been permanently deleted",
      });

      // Redirect to teams page
      window.location.href = "/tournaments/teams";
    } catch (error: any) {
      console.error("Error deleting team:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete team",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="px-4 py-6 mx-auto max-w-screen-xl sm:px-6 lg:px-8 xl:px-12 sm:py-8 lg:py-10">
          <div className="mb-4 sm:mb-6">
            <Skeleton className="w-32 h-10" />
          </div>
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col gap-4 justify-between items-start sm:flex-row sm:items-center">
              <div className="flex gap-3 items-center">
                <Skeleton className="w-12 h-12 rounded-xl" />
                <div className="space-y-2">
                  <Skeleton className="w-48 h-8 sm:w-64" />
                  <Skeleton className="w-32 h-4" />
                </div>
              </div>
              <div className="flex gap-2">
                <Skeleton className="w-24 h-12" />
                <Skeleton className="w-24 h-12" />
              </div>
            </div>
          </div>
          <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
            <Card className="border-2 lg:col-span-2">
              <CardHeader>
                <Skeleton className="w-32 h-6" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="w-full h-4" />
                <Skeleton className="w-3/4 h-4" />
                <Skeleton className="w-full h-4" />
                <Skeleton className="w-2/3 h-4" />
              </CardContent>
            </Card>
            <Card className="border-2">
              <CardHeader>
                <Skeleton className="w-32 h-6" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="w-full h-16 rounded-lg" />
                <Skeleton className="w-full h-12 rounded-lg" />
                <Skeleton className="w-full h-12 rounded-lg" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-background">
        <Card className="mx-4 max-w-md border-2">
          <CardContent className="p-8 text-center">
            <div className="flex flex-col gap-4 items-center">
              <div className="p-3 rounded-full bg-destructive/10">
                <AlertCircle className="w-8 h-8 text-destructive" />
              </div>
              <div>
                <h2 className="mb-2 text-xl font-bold">Team Not Found</h2>
                <p className="mb-4 text-sm text-muted-foreground">
                  The team you&apos;re looking for doesn&apos;t exist or has
                  been removed.
                </p>
                <Button onClick={() => router.push("/tournaments/teams")}>
                  <ArrowLeft className="mr-2 w-4 h-4" />
                  Back to Teams
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="px-4 py-6 mx-auto max-w-screen-xl sm:px-6 lg:px-8 xl:px-12 sm:py-8 lg:py-10">
        {/* Back button */}
        <div className="mb-4 sm:mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/tournaments/teams")}
            className="flex gap-2 items-center h-9 sm:h-10"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Teams
          </Button>
        </div>

        <TeamHeader
          teamName={team.name}
          teamTag={team.tag}
          teamElo={team.teamElo}
          wins={team.wins}
          losses={team.losses}
        />

        <div className="space-y-6 sm:space-y-8">
          {/* First Row: Team Details and Members */}
          <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
            {/* Team Details Card */}
            <Card className="bg-gradient-to-br border-2 shadow-lg lg:col-span-2 from-card via-card to-primary/5">
              <CardHeader className="pb-4 border-b border-border/50">
                <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-start">
                  <div className="flex gap-3 items-center">
                    <div className="relative p-2.5 bg-gradient-to-br rounded-xl border-2 shadow-md from-primary/30 to-primary/20 border-primary/40 ring-1 ring-primary/20">
                      <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <CardTitle className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r sm:text-2xl from-foreground via-foreground to-foreground/70">
                        Team Details
                      </CardTitle>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Information about {team.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 items-center">
                    {/* <div className="flex gap-2 items-center px-4 py-2 rounded-lg bg-card">
                      <TrendingUp className="w-5 h-5 text-primary" />
                      <span className="text-xl font-bold">
                        {team &&
                        team.teamElo !== undefined &&
                        team.teamElo !== null
                          ? Number(team.teamElo).toLocaleString()
                          : "N/A"}
                      </span>
                    </div> */}
                    {canRefreshElo() && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleRefreshElo}
                        disabled={isRefreshingElo}
                        className="h-9 sm:h-10"
                      >
                        {isRefreshingElo ? (
                          <>
                            <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                            <span className="hidden sm:inline">
                              Refreshing...
                            </span>
                            <span className="sm:hidden">...</span>
                          </>
                        ) : (
                          <>
                            <RefreshCw className="mr-2 w-4 h-4" />
                            <span className="hidden sm:inline">
                              Refresh ELO
                            </span>
                            <span className="sm:hidden">Refresh</span>
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {isTeamCaptain ? (
                  <TeamSettingsForm team={team} formatDate={formatDate} />
                ) : (
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="p-4 bg-gradient-to-br rounded-lg border-2 transition-colors from-card via-card to-primary/5 hover:bg-primary/10">
                      <div className="flex gap-2 items-center mb-2">
                        <Shield className="w-4 h-4 text-primary" />
                        <h3 className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">
                          Team Name
                        </h3>
                      </div>
                      <p className="text-xl font-bold">{team.name}</p>
                    </div>

                    <div className="p-4 bg-gradient-to-br rounded-lg border-2 transition-colors from-card via-card to-primary/5 hover:bg-primary/10">
                      <div className="flex gap-2 items-center mb-2">
                        <Badge className="flex justify-center items-center p-0 w-4 h-4 text-primary bg-primary/20 border-primary/30" />
                        <h3 className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">
                          Team Tag
                        </h3>
                      </div>
                      <Badge
                        variant="secondary"
                        className="px-3 py-1 text-lg font-bold"
                      >
                        [{team.tag}]
                      </Badge>
                    </div>

                    <div className="p-4 bg-gradient-to-br rounded-lg border-2 transition-colors from-card via-card to-primary/5 hover:bg-primary/10 sm:col-span-2">
                      <div className="flex gap-2 items-center mb-2">
                        <Settings className="w-4 h-4 text-primary" />
                        <h3 className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">
                          Description
                        </h3>
                      </div>
                      <p className="text-base leading-relaxed text-foreground">
                        {team.description || (
                          <span className="italic text-muted-foreground">
                            No description available
                          </span>
                        )}
                      </p>
                    </div>

                    {team && team.createdAt && (
                      <div className="p-4 bg-gradient-to-br rounded-lg border-2 transition-colors from-card via-card to-primary/5 hover:bg-primary/10">
                        <div className="flex gap-2 items-center mb-2">
                          <Trophy className="w-4 h-4 text-primary" />
                          <h3 className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">
                            Created
                          </h3>
                        </div>
                        <p className="text-base font-medium">
                          {formatDate(team.createdAt)}
                        </p>
                      </div>
                    )}

                    <div className="p-4 bg-gradient-to-br rounded-lg border-2 transition-colors from-card via-card to-primary/5 hover:bg-primary/10">
                      <div className="flex gap-2 items-center mb-2">
                        <Users className="w-4 h-4 text-primary" />
                        <h3 className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">
                          Team Size
                        </h3>
                      </div>
                      <Badge
                        variant="secondary"
                        className="px-3 py-1 text-base font-bold"
                      >
                        {team.teamSize === 2
                          ? "2v2"
                          : team.teamSize === 3
                          ? "3v3"
                          : team.teamSize === 4
                          ? "4v4"
                          : team.teamSize === 5
                          ? "5v5"
                          : "4v4"}{" "}
                        ({team.teamSize || 4} players)
                      </Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Team Members Card */}
            <Card className="bg-gradient-to-br border-2 shadow-lg from-card via-card to-primary/5">
              <CardHeader className="pb-4 border-b border-border/50">
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
                  <div className="flex gap-3 items-center">
                    <div className="relative p-2.5 bg-gradient-to-br rounded-xl border-2 shadow-md from-primary/30 to-primary/20 border-primary/40 ring-1 ring-primary/20">
                      <Users className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r sm:text-xl from-foreground via-foreground to-foreground/70">
                      Team Members
                    </CardTitle>
                  </div>
                  {isTeamCaptain &&
                    (() => {
                      const teamSize = team.teamSize || 4;
                      const currentMembers = team.members.filter(
                        (m) =>
                          m.role.toLowerCase() !== "substitute" &&
                          m.discordId !== team.captain.discordId
                      ).length;
                      return (
                        currentMembers < teamSize - 1 && (
                          <Button
                            size="sm"
                            onClick={() => {
                              const event = new CustomEvent("openInviteModal", {
                                detail: { teamId: team._id },
                              });
                              window.dispatchEvent(event);
                            }}
                            className="w-full h-9 sm:h-10 sm:w-auto"
                          >
                            <UserPlus className="mr-2 w-4 h-4" />
                            <span className="hidden sm:inline">
                              Invite Player
                            </span>
                            <span className="sm:hidden">Invite</span>
                          </Button>
                        )
                      );
                    })()}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Captain Section */}
                  <div>
                    <h3 className="mb-3 text-xs font-semibold tracking-wide uppercase sm:text-sm text-muted-foreground">
                      Captain
                    </h3>
                    <div className="relative p-4 bg-gradient-to-br rounded-xl border-2 shadow-lg transition-all duration-300 group sm:p-5 from-amber-500/20 via-amber-500/10 to-amber-500/5 border-amber-500/30 hover:shadow-xl hover:border-amber-500/50 hover:from-amber-500/25 hover:via-amber-500/15">
                      <div className="absolute inset-0 bg-gradient-to-br to-transparent rounded-xl opacity-0 transition-opacity from-amber-500/10 group-hover:opacity-100" />
                      <div className="flex relative gap-4 items-center">
                        <div className="flex overflow-hidden relative justify-center items-center w-12 h-12 bg-gradient-to-br rounded-full border-2 ring-2 ring-offset-2 shadow-lg ring-offset-background sm:w-14 sm:h-14 from-amber-500/30 to-amber-500/20 border-amber-500/40 ring-amber-500/20">
                          {team.captain.discordProfilePicture ? (
                            <Image
                              src={team.captain.discordProfilePicture}
                              alt={team.captain.discordNickname}
                              width={56}
                              height={56}
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            <Users className="w-6 h-6 text-amber-500 sm:w-7 sm:h-7" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-base font-bold truncate sm:text-lg mb-1.5">
                            {team.captain.discordNickname}
                          </p>
                          <Badge className="text-xs font-semibold text-amber-700 shadow-sm bg-amber-500/30 dark:text-amber-300 border-amber-500/50">
                            Captain
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Active Members Section */}
                  <div>
                    <h3 className="mb-3 text-xs font-semibold tracking-wide uppercase sm:text-sm text-muted-foreground">
                      Active Members (
                      {
                        team.members.filter(
                          (m) =>
                            m.role.toLowerCase() !== "substitute" &&
                            m.discordId !== team.captain.discordId
                        ).length
                      }
                      /
                      {(() => {
                        const teamSize = team.teamSize || 4;
                        return teamSize - 1; // Subtract 1 for captain
                      })()}
                      )
                    </h3>
                    <div className="space-y-2">
                      {team.members
                        .filter(
                          (member) =>
                            member.role.toLowerCase() !== "substitute" &&
                            member.discordId !== team.captain.discordId
                        )
                        .map((member) => (
                          <div
                            key={member.discordId}
                            className="flex justify-between items-center p-3 bg-gradient-to-br rounded-xl border-2 transition-all duration-200 group sm:p-4 from-card via-card to-primary/5 hover:from-primary/10 hover:via-primary/5 hover:to-primary/10 hover:shadow-md hover:border-primary/40"
                          >
                            <div className="flex flex-1 gap-3 items-center min-w-0">
                              <div className="overflow-hidden relative w-11 h-11 bg-gradient-to-br rounded-full border-2 ring-1 shadow-sm sm:w-12 sm:h-12 from-primary/30 to-primary/20 border-primary/40 shrink-0 ring-primary/20">
                                {member.discordProfilePicture ? (
                                  <Image
                                    src={member.discordProfilePicture}
                                    alt={member.discordNickname}
                                    width={48}
                                    height={48}
                                    className="object-cover w-full h-full"
                                  />
                                ) : (
                                  <div className="flex justify-center items-center w-full h-full">
                                    <Users className="w-5 h-5 text-primary sm:w-6 sm:h-6" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold truncate sm:text-base">
                                  {member.discordNickname}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Member
                                </p>
                              </div>
                            </div>
                            {isTeamCaptain && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="w-9 h-9 text-red-500 border-2 border-transparent transition-all hover:text-red-700 hover:bg-red-500/20 hover:border-red-500/30 sm:h-10 sm:w-10 shrink-0"
                                onClick={() =>
                                  handleRemoveMemberClick(
                                    member.discordId,
                                    member.discordNickname ||
                                      member.discordUsername ||
                                      "this member"
                                  )
                                }
                              >
                                <UserMinus className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                      {team.members.filter(
                        (m) =>
                          m.role.toLowerCase() !== "substitute" &&
                          m.discordId !== team.captain.discordId
                      ).length === 0 && (
                        <div className="p-6 text-center rounded-lg border-2 border-dashed sm:p-8 bg-muted/30">
                          <div className="flex flex-col gap-3 items-center">
                            <div className="p-3 rounded-full bg-muted/50">
                              <Users className="w-6 h-6 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="mb-1 text-sm font-medium">
                                No active members yet
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {isTeamCaptain
                                  ? "Invite players to join your team"
                                  : "This team is looking for members"}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Substitutes Section */}
                  {team.members.some(
                    (member) => member.role.toLowerCase() === "substitute"
                  ) && (
                    <div>
                      <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                        Substitutes
                      </h3>
                      <div className="space-y-2">
                        {team.members
                          .filter(
                            (member) =>
                              member.role.toLowerCase() === "substitute"
                          )
                          .map((member) => (
                            <div
                              key={member.discordId}
                              className="flex justify-between items-center p-3 bg-gradient-to-br rounded-xl border-2 transition-all duration-200 group sm:p-4 from-card via-card to-muted/30 hover:from-muted/50 hover:via-muted/40 hover:to-muted/50 hover:shadow-sm border-border/50"
                            >
                              <div className="flex gap-3 items-center">
                                <div className="overflow-hidden relative w-10 h-10 rounded-full border shadow-sm border-border/50 sm:w-11 sm:h-11">
                                  {member.discordProfilePicture ? (
                                    <Image
                                      src={member.discordProfilePicture}
                                      alt={member.discordNickname}
                                      width={44}
                                      height={44}
                                      className="object-cover w-full h-full"
                                    />
                                  ) : (
                                    <div className="flex justify-center items-center w-full h-full bg-muted">
                                      <Users className="w-5 h-5 text-muted-foreground" />
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <p className="text-sm font-medium sm:text-base">
                                    {member.discordNickname}
                                  </p>
                                  <Badge
                                    variant="outline"
                                    className="text-xs mt-0.5"
                                  >
                                    Substitute
                                  </Badge>
                                </div>
                              </div>
                              {isTeamCaptain && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="w-9 h-9 text-red-500 border-2 border-transparent transition-all hover:text-red-700 hover:bg-red-500/20 hover:border-red-500/30 sm:h-10 sm:w-10"
                                  onClick={() =>
                                    handleRemoveMemberClick(
                                      member.discordId,
                                      member.discordNickname ||
                                        member.discordUsername ||
                                        "this member"
                                    )
                                  }
                                >
                                  <UserMinus className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Leave Team option for non-captain members */}
          {team &&
            session?.user?.id &&
            team.members.some((m) => m.discordId === session.user.id) &&
            !isTeamCaptain && (
              <Card className="bg-gradient-to-br border-2 shadow-lg border-red-500/30 from-red-500/10 via-red-500/5 to-red-500/10">
                <CardHeader className="border-b border-red-500/20">
                  <div className="flex gap-3 items-center">
                    <div className="relative p-2.5 rounded-xl border-2 shadow-md bg-red-500/30 border-red-500/40 ring-1 ring-red-500/20">
                      <LogIn className="w-5 h-5 text-red-500 sm:w-6 sm:h-6" />
                    </div>
                    <CardTitle className="text-lg font-bold text-red-500 sm:text-xl">
                      Leave Team
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      If you leave this team, you&apos;ll need to be invited
                      again to rejoin.
                    </p>
                    <Button
                      variant="destructive"
                      onClick={async () => {
                        if (
                          !confirm("Are you sure you want to leave this team?")
                        ) {
                          return;
                        }

                        setIsSubmitting(true);
                        try {
                          const response = await fetch(
                            `/api/teams/${team._id}/leave`,
                            {
                              method: "POST",
                            }
                          );

                          if (!response.ok) {
                            const data = await response.json();
                            throw new Error(
                              data.error || "Failed to leave team"
                            );
                          }

                          toast({
                            title: "Success",
                            description: "You have left the team",
                            duration: 2000,
                          });

                          // Navigate back to teams page
                          window.location.href = "/tournaments/teams";
                        } catch (error: any) {
                          console.error("Error leaving team:", error);
                          toast({
                            title: "Error",
                            description:
                              error.message || "Failed to leave team",
                            variant: "destructive",
                            duration: 2000,
                          });
                        } finally {
                          setIsSubmitting(false);
                        }
                      }}
                      disabled={isSubmitting}
                      className="w-full h-10 sm:h-11 sm:w-auto"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                          Leaving...
                        </>
                      ) : (
                        <>
                          <LogIn className="mr-2 w-4 h-4" />
                          Leave Team
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

          {/* Captain Settings Section (Middle Row) */}
          {isTeamCaptain && (
            <Card className="bg-gradient-to-br border-2 shadow-lg from-card via-card to-primary/5">
              <CardHeader className="border-b border-border/50">
                <div className="flex gap-3 items-center">
                  <div className="relative p-2.5 bg-gradient-to-br rounded-xl border-2 shadow-md from-primary/30 to-primary/20 border-primary/40 ring-1 ring-primary/20">
                    <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r sm:text-xl from-foreground via-foreground to-foreground/70">
                    Captain Settings
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="mb-2 text-base font-semibold sm:text-lg">
                      Transfer Captain Role
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      This will transfer your captain privileges to another team
                      member. This action cannot be undone.
                    </p>
                  </div>

                  <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                    <div className="flex-1 space-y-2">
                      <Label
                        htmlFor="newCaptain"
                        className="text-sm font-medium"
                      >
                        Select New Captain
                      </Label>
                      <div className="flex gap-2 items-center">
                        <Select
                          value={newCaptainId}
                          onValueChange={setNewCaptainId}
                          disabled={
                            team.members.filter(
                              (member) => member.discordId !== session?.user?.id
                            ).length === 0
                          }
                        >
                          <SelectTrigger
                            id="newCaptain"
                            className="w-full sm:w-[280px] h-10 sm:h-11"
                          >
                            <SelectValue
                              placeholder={
                                team.members.filter(
                                  (member) =>
                                    member.discordId !== session?.user?.id
                                ).length === 0
                                  ? "No other members"
                                  : "Choose a team member"
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {team.members
                              .filter(
                                (member) =>
                                  member.discordId !== session?.user?.id
                              )
                              .map((member) => (
                                <SelectItem
                                  key={member.discordId}
                                  value={member.discordId}
                                >
                                  {member.discordNickname ||
                                    member.discordUsername}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>

                        {/* Add clear button */}
                        {newCaptainId && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setNewCaptainId("")}
                            className="w-10 h-10 shrink-0"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleTransferCaptain}
                      disabled={
                        !newCaptainId ||
                        isSubmitting ||
                        team.members.filter(
                          (member) => member.discordId !== session?.user?.id
                        ).length === 0
                      }
                      className="w-full h-10 sm:h-11 sm:w-auto"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                          <span className="hidden sm:inline">
                            Transferring...
                          </span>
                          <span className="sm:hidden">...</span>
                        </>
                      ) : (
                        <>
                          <Shield className="mr-2 w-4 h-4" />
                          <span className="hidden sm:inline">
                            Transfer Captain Role
                          </span>
                          <span className="sm:hidden">Transfer</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Delete Team Section - Only shown to captain with no other members */}
          {isTeamCaptain &&
            team.members.filter((m) => m.discordId !== session?.user?.id)
              .length === 0 && (
              <Card className="bg-gradient-to-br border-2 shadow-lg border-red-500/30 from-red-500/10 via-red-500/5 to-red-500/10">
                <CardHeader className="border-b border-red-500/20">
                  <div className="flex gap-3 items-center">
                    <div className="relative p-2.5 rounded-xl border-2 shadow-md bg-red-500/30 border-red-500/40 ring-1 ring-red-500/20">
                      <AlertCircle className="w-5 h-5 text-red-500 sm:w-6 sm:h-6" />
                    </div>
                    <CardTitle className="text-lg font-bold text-red-500 sm:text-xl">
                      Delete Team
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Since you have no other team members, you can permanently
                      delete this team. This action cannot be undone.
                    </p>
                    <Button
                      variant="destructive"
                      onClick={() => setShowDeleteDialog(true)}
                      disabled={isSubmitting}
                      className="w-full h-10 sm:h-11 sm:w-auto"
                    >
                      <AlertCircle className="mr-2 w-4 h-4" />
                      Delete Team Permanently
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

          {/* Recent Invites Section (Bottom Row) */}
          {isTeamCaptain && (
            <Card className="bg-gradient-to-br border-2 shadow-lg from-card via-card to-primary/5">
              <TeamInvitesList teamId={team._id} isCaptain={isTeamCaptain} />
            </Card>
          )}

          {/* Delete Team Confirmation Dialog */}
          <AlertDialog
            open={showDeleteDialog}
            onOpenChange={setShowDeleteDialog}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex gap-2 items-center">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  Delete Team Permanently?
                </AlertDialogTitle>
                <AlertDialogDescription className="space-y-2">
                  <p>
                    Are you sure you want to permanently delete{" "}
                    <strong>{team.name}</strong>? This action cannot be undone.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    All team data, including member history and statistics, will
                    be permanently removed.
                  </p>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteTeam}
                  className="bg-red-500 hover:bg-red-600 focus:ring-red-500"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    "Delete Permanently"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Request to Join button for non-members */}
          {team &&
            session?.user?.id &&
            !team.members.some((m) => m.discordId === session.user.id) && (
              <Card className="border-2">
                <CardHeader>
                  <div className="flex gap-3 items-center">
                    <div className="relative p-2 bg-gradient-to-br rounded-lg border shadow-sm from-primary/20 to-primary/10 border-primary/30">
                      <UserPlus className="w-5 h-5 text-primary" />
                    </div>
                    <CardTitle className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r sm:text-xl from-foreground to-foreground/80">
                      Join This Team
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(() => {
                      const teamSize = team.teamSize || 4;
                      const isTeamFull = team.members.length >= teamSize;

                      if (isTeamFull) {
                        return (
                          <div className="p-4 rounded-lg border-2 border-yellow-500/30 bg-yellow-500/10">
                            <div className="flex gap-2 items-center">
                              <AlertCircle className="w-5 h-5 text-yellow-500 shrink-0" />
                              <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                                This team is full ({teamSize}/{teamSize}{" "}
                                members)
                              </p>
                            </div>
                          </div>
                        );
                      }

                      if (hasPendingRequest) {
                        return (
                          <div className="space-y-4">
                            <div className="p-4 rounded-lg border-2 border-blue-500/30 bg-blue-500/10">
                              <div className="flex gap-2 items-center">
                                <AlertCircle className="w-5 h-5 text-blue-500 shrink-0" />
                                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                  You have a pending request to join this team
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              className="w-full h-10 border-red-500/50 hover:bg-red-500/10 hover:border-red-500 sm:h-11 sm:w-auto"
                              onClick={async () => {
                                if (
                                  !confirm(
                                    "Are you sure you want to cancel your join request?"
                                  )
                                ) {
                                  return;
                                }

                                setIsSubmitting(true);
                                try {
                                  const response = await fetch(
                                    `/api/teams/${team._id}/cancel-join-request`,
                                    {
                                      method: "POST",
                                    }
                                  );

                                  if (!response.ok) {
                                    const data = await response.json();
                                    throw new Error(
                                      data.error ||
                                        "Failed to cancel join request"
                                    );
                                  }

                                  setHasPendingRequest(false);
                                  toast({
                                    title: "Success",
                                    description: "Join request cancelled",
                                    duration: 2000,
                                  });
                                } catch (error: any) {
                                  console.error(
                                    "Error cancelling join request:",
                                    error
                                  );
                                  toast({
                                    title: "Error",
                                    description:
                                      error.message ||
                                      "Failed to cancel join request",
                                    variant: "destructive",
                                  });
                                } finally {
                                  setIsSubmitting(false);
                                }
                              }}
                              disabled={isSubmitting}
                            >
                              {isSubmitting ? (
                                <>
                                  <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                                  Cancelling...
                                </>
                              ) : (
                                <>
                                  <X className="mr-2 w-4 h-4" />
                                  Cancel Join Request
                                </>
                              )}
                            </Button>
                          </div>
                        );
                      }

                      const userTeamSize = userCurrentTeam?.teamSize || 4;
                      const targetTeamSize = teamSize || 4;
                      const isSameSizeTeam =
                        userCurrentTeam && userTeamSize === targetTeamSize;

                      return (
                        <>
                          <p className="text-sm text-muted-foreground">
                            This team has {team.members.length}/{teamSize || 4}{" "}
                            members. Send a request to join this team.
                          </p>
                          {isSameSizeTeam ? (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span>
                                    <Button
                                      disabled={true}
                                      className="flex gap-2 items-center mt-2 cursor-not-allowed"
                                    >
                                      <UserPlus className="w-4 h-4" />
                                      Request to Join
                                    </Button>
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>
                                    You are already a member of a{" "}
                                    {targetTeamSize}-person team &quot;
                                    {userCurrentTeam.name}&quot;. Leave your
                                    current team to join another team of the
                                    same size.
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : (
                            <Button
                              onClick={async () => {
                                setIsSubmitting(true);
                                try {
                                  const response = await fetch(
                                    `/api/teams/${team._id}/request-join`,
                                    {
                                      method: "POST",
                                    }
                                  );

                                  if (!response.ok) {
                                    const data = await response.json();
                                    throw new Error(
                                      data.error ||
                                        "Failed to send join request"
                                    );
                                  }

                                  setHasPendingRequest(true);
                                  toast({
                                    title: "Success",
                                    description:
                                      "Join request sent to team captain",
                                    duration: 2000,
                                  });
                                } catch (error: any) {
                                  console.error(
                                    "Error requesting to join team:",
                                    error
                                  );
                                  toast({
                                    title: "Error",
                                    description:
                                      error.message ||
                                      "Failed to send join request",
                                    variant: "destructive",
                                  });
                                } finally {
                                  setIsSubmitting(false);
                                }
                              }}
                              disabled={isSubmitting}
                              className="mt-2 w-full h-10 sm:h-11 sm:w-auto"
                            >
                              {isSubmitting ? (
                                <>
                                  <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                                  <span className="hidden sm:inline">
                                    Sending Request...
                                  </span>
                                  <span className="sm:hidden">Sending...</span>
                                </>
                              ) : (
                                <>
                                  <UserPlus className="mr-2 w-4 h-4" />
                                  Request to Join
                                </>
                              )}
                            </Button>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </CardContent>
              </Card>
            )}
        </div>

        {/* Transfer Captain Confirmation Dialog */}
        <AlertDialog
          open={showTransferCaptainDialog}
          onOpenChange={setShowTransferCaptainDialog}
        >
          <AlertDialogContent className="sm:max-w-[425px]">
            <AlertDialogHeader>
              <div className="flex gap-3 items-center mb-2">
                <div className="relative p-2 rounded-lg border bg-amber-500/20 border-amber-500/30">
                  <Shield className="w-5 h-5 text-amber-500" />
                </div>
                <AlertDialogTitle className="text-lg sm:text-xl">
                  Transfer Captain Role
                </AlertDialogTitle>
              </div>
              <AlertDialogDescription className="pt-2 space-y-2 text-sm sm:text-base">
                <p>
                  Are you sure you want to transfer the captain role to{" "}
                  <span className="font-semibold text-foreground">
                    {team?.members.find((m) => m.discordId === newCaptainId)
                      ?.discordNickname ||
                      team?.members.find((m) => m.discordId === newCaptainId)
                        ?.discordUsername ||
                      "this member"}
                  </span>
                  ?
                </p>
                <div className="p-3 mt-3 rounded-lg border-2 border-amber-500/30 bg-amber-500/10">
                  <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                    ⚠️ Warning: This action cannot be undone!
                  </p>
                  <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
                    You will lose all captain privileges and will not be able to
                    reverse this transfer yourself. Only the new captain can
                    transfer leadership back to you.
                  </p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col gap-2 sm:flex-row sm:gap-0">
              <AlertDialogCancel
                className="w-full h-10 sm:w-auto sm:h-11"
                disabled={isSubmitting}
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmTransferCaptain}
                disabled={isSubmitting}
                className="w-full h-10 bg-amber-600 sm:w-auto sm:h-11 hover:bg-amber-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                    Transferring...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 w-4 h-4" />
                    Transfer Captain Role
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Remove Member Confirmation Dialog */}
        <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
          <AlertDialogContent className="sm:max-w-[425px]">
            <AlertDialogHeader>
              <div className="flex gap-3 items-center mb-2">
                <div className="relative p-2 rounded-lg border bg-red-500/20 border-red-500/30">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                </div>
                <AlertDialogTitle className="text-lg sm:text-xl">
                  Remove Team Member
                </AlertDialogTitle>
              </div>
              <AlertDialogDescription className="pt-2 text-sm sm:text-base">
                Are you sure you want to remove{" "}
                <span className="font-semibold text-foreground">
                  {memberToRemove?.name}
                </span>{" "}
                from the team? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col gap-2 sm:flex-row sm:gap-0">
              <AlertDialogCancel
                className="w-full h-10 sm:w-auto sm:h-11"
                disabled={isSubmitting}
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleRemoveMember}
                disabled={isSubmitting}
                className="w-full h-10 bg-red-500 sm:w-auto sm:h-11 hover:bg-red-600"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                    Removing...
                  </>
                ) : (
                  <>
                    <UserMinus className="mr-2 w-4 h-4" />
                    Remove Member
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
