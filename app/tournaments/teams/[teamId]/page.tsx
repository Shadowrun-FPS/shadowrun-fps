"use client";

import { useEffect, useState } from "react";
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
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

interface TeamMember {
  discordId: string;
  discordNickname: string;
  discordUsername?: string;
  role: string;
  discordProfilePicture?: string;
}

interface Team {
  _id: string;
  name: string;
  tag: string;
  description: string;
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
  const router = useRouter();

  const isTeamCaptain = session?.user?.id === team?.captain.discordId;

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        // Check if the teamId is a valid MongoDB ObjectId (24 hex characters)
        const isObjectId = /^[0-9a-fA-F]{24}$/.test(params.teamId);

        // Use the appropriate endpoint based on whether teamId is an ObjectId or tag
        const endpoint = isObjectId
          ? `/api/teams/${params.teamId}`
          : `/api/teams/tag/${params.teamId}`;

        const response = await fetch(endpoint);
        if (!response.ok) throw new Error("Failed to load team data");
        const data = await response.json();
        setTeam(data);
        // Log team data for debugging
        // console.log("Loaded team data:", data);
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

    if (
      !confirm(
        "Are you sure you want to transfer the captain role? This cannot be undone."
      )
    ) {
      return;
    }

    setIsSubmitting(true);
    try {
      console.log("Transferring captain to:", newCaptainId);

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
  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!isTeamCaptain) {
      toast({
        title: "Permission Denied",
        description: "Only the team captain can remove members",
        variant: "destructive",
      });
      return;
    }

    if (
      !confirm(`Are you sure you want to remove ${memberName} from the team?`)
    ) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/teams/${team?._id}/remove-member`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ memberId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to remove team member");
      }

      toast({
        title: "Success",
        description: `${memberName} has been removed from the team`,
      });

      // Reload the page to reflect changes
      window.location.reload();
    } catch (error: any) {
      console.error("Error removing member:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to remove team member",
        variant: "destructive",
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
            session?.user?.id === "238329746671271936" ||
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
    if (session.user.id === "238329746671271936") return true;

    // Allow users with admin roles
    return (
      Array.isArray(session.user.roles) && session.user.roles.includes("admin")
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!team) {
    return <div>Team not found</div>;
  }

  const getRoleBadgeStyle = (role: string) => {
    switch (role.toLowerCase()) {
      case "captain":
        return "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20";
      case "member":
        return "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20";
      case "substitute":
        return "bg-gray-500/10 text-gray-500 hover:bg-gray-500/20";
      default:
        return "bg-primary/10 text-primary hover:bg-primary/20";
    }
  };

  return (
    <div className="space-y-6">
      <TeamHeader
        teamName={team.name}
        teamTag={team.tag}
        teamElo={team.teamElo}
      />

      <div className="min-h-screen">
        <main className="container px-4 py-8 mx-auto space-y-6">
          {/* First Row: Team Details and Members */}
          <div className="grid gap-6 md:grid-cols-3">
            {/* Team Details Card */}
            <Card className="md:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-2xl font-bold">
                      Team Details
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Information about {team.name}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card">
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
                      >
                        {isRefreshingElo ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Refreshing...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Refresh ELO
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {isTeamCaptain ? (
                  <TeamSettingsForm team={team} />
                ) : (
                  <>
                    <div>
                      <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                        Team Name
                      </h3>
                      <p className="text-xl font-semibold">{team.name}</p>
                    </div>

                    <div>
                      <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                        Team Tag
                      </h3>
                      <Badge variant="secondary" className="text-lg">
                        [{team.tag}]
                      </Badge>
                    </div>

                    <div>
                      <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                        Description
                      </h3>
                      <p className="text-muted-foreground">
                        {team.description || "No description available"}
                      </p>
                    </div>

                    {team && team.createdAt && (
                      <div>
                        <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                          Created
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(team.createdAt)}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Team Members Card */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Team Members
                  </CardTitle>
                  {isTeamCaptain && team.members.length < 4 && (
                    <Button
                      size="sm"
                      onClick={() => {
                        const event = new CustomEvent("openInviteModal", {
                          detail: { teamId: team._id },
                        });
                        window.dispatchEvent(event);
                      }}
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Invite Player
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Captain Section */}
                  <div>
                    <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                      Captain
                    </h3>
                    <div className="p-3 border rounded-lg bg-card/50 border-border/50">
                      <div className="flex items-center gap-3">
                        <div className="relative flex items-center justify-center w-10 h-10 overflow-hidden rounded-full bg-accent">
                          {team.captain.discordProfilePicture ? (
                            <Image
                              src={team.captain.discordProfilePicture}
                              alt={team.captain.discordNickname}
                              width={48}
                              height={48}
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            <Users className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">
                            {team.captain.discordNickname}
                          </p>
                          <Badge className="mt-1 bg-amber-900/20 text-amber-300 border-amber-700">
                            Captain
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Active Members Section */}
                  <div>
                    <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                      Active Members
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
                            className="flex items-center justify-between p-3 border rounded-lg bg-card border-border"
                          >
                            <div className="flex items-center gap-3">
                              <div className="relative w-10 h-10 overflow-hidden rounded-full">
                                {member.discordProfilePicture ? (
                                  <Image
                                    src={member.discordProfilePicture}
                                    alt={member.discordNickname}
                                    width={48}
                                    height={48}
                                    className="object-cover w-full h-full"
                                  />
                                ) : (
                                  <div className="flex items-center justify-center w-full h-full bg-secondary">
                                    <Users className="w-5 h-5 text-muted-foreground" />
                                  </div>
                                )}
                              </div>
                              <p>{member.discordNickname}</p>
                            </div>
                            {isTeamCaptain && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-red-500 hover:text-red-700 hover:bg-red-500/10"
                                onClick={() =>
                                  handleRemoveMember(
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
                              className="flex items-center justify-between p-3 border rounded-lg bg-card border-border"
                            >
                              <div className="flex items-center gap-3">
                                <div className="relative w-10 h-10 overflow-hidden rounded-full">
                                  {member.discordProfilePicture ? (
                                    <Image
                                      src={member.discordProfilePicture}
                                      alt={member.discordNickname}
                                      width={48}
                                      height={48}
                                      className="object-cover w-full h-full"
                                    />
                                  ) : (
                                    <div className="flex items-center justify-center w-full h-full bg-secondary">
                                      <Users className="w-5 h-5 text-muted-foreground" />
                                    </div>
                                  )}
                                </div>
                                <p>{member.discordNickname}</p>
                              </div>
                              {isTeamCaptain && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-red-500 hover:text-red-700 hover:bg-red-500/10"
                                  onClick={() =>
                                    handleRemoveMember(
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
              <div className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-red-500">Leave Team</CardTitle>
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
                            !confirm(
                              "Are you sure you want to leave this team?"
                            )
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
                            });
                          } finally {
                            setIsSubmitting(false);
                          }
                        }}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Leaving...
                          </>
                        ) : (
                          "Leave Team"
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

          {/* Captain Settings Section (Middle Row) */}
          {isTeamCaptain && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card className="md:col-span-2 lg:col-span-3">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Captain Settings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">
                      Transfer Captain Role
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      This will transfer your captain privileges to another team
                      member. This action cannot be undone.
                    </p>

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                      <div className="space-y-2">
                        <Label htmlFor="newCaptain">Select New Captain</Label>
                        <div className="flex items-center gap-2">
                          <Select
                            value={newCaptainId}
                            onValueChange={setNewCaptainId}
                          >
                            <SelectTrigger
                              id="newCaptain"
                              className="w-[280px]"
                            >
                              <SelectValue placeholder="Choose a team member" />
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
                              className="w-10 h-10"
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
                        disabled={!newCaptainId || isSubmitting}
                        className="mt-2"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Transferring...
                          </>
                        ) : (
                          <>
                            <Shield className="w-4 h-4 mr-2" />
                            Transfer Captain Role
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Recent Invites Section (Bottom Row) */}
          {isTeamCaptain && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card className="md:col-span-2 lg:col-span-3">
                <TeamInvitesList teamId={team._id} isCaptain={isTeamCaptain} />
              </Card>
            </div>
          )}

          {/* Request to Join button for non-members */}
          {team &&
            session?.user?.id &&
            !team.members.some((m) => m.discordId === session.user.id) && (
              <div className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Join This Team</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {(() => {
                        // Check if team is full (4 members total)
                        const isTeamFull = team.members.length >= 4;

                        if (isTeamFull) {
                          return (
                            <div className="p-3 border border-yellow-800 rounded bg-yellow-900/20">
                              <p className="text-sm font-medium text-yellow-400">
                                This team is full (4/4 members)
                              </p>
                            </div>
                          );
                        }

                        if (hasPendingRequest) {
                          return (
                            <div className="space-y-4">
                              <div className="p-3 border border-blue-800 rounded bg-blue-900/20">
                                <p className="text-sm font-medium text-blue-400">
                                  You have a pending request to join this team
                                </p>
                              </div>
                              <Button
                                variant="outline"
                                className="border-red-500 hover:bg-red-500/10"
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
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Cancelling...
                                  </>
                                ) : (
                                  <>
                                    <X className="w-4 h-4 mr-2" />
                                    Cancel Join Request
                                  </>
                                )}
                              </Button>
                            </div>
                          );
                        }

                        return (
                          <>
                            <p className="text-sm text-muted-foreground">
                              This team has {team.members.length}/4 members.
                              Send a request to join this team.
                            </p>
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
                            >
                              {isSubmitting ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Sending request...
                                </>
                              ) : (
                                <>
                                  <LogIn className="w-4 h-4 mr-2" />
                                  Request to Join
                                </>
                              )}
                            </Button>
                          </>
                        );
                      })()}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

          {/* Back button */}
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
              className="flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </div>
        </main>
      </div>
    </div>
  );
}
