"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { InvitePlayerDialog } from "@/components/teams/invite-player-dialog";
import { Loader2, Shield, AlertCircle } from "lucide-react";
import type {
  TeamMember,
  MongoTeam,
  TeamInviteResponse,
  TeamResponse,
} from "@/types/mongodb";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ObjectId } from "mongodb";
import { ChallengeTeamDialog } from "@/components/teams/challenge-team-dialog";

interface TeamInvite {
  _id: ObjectId | string;
  inviteeId: string;
  inviteeName: string;
  status: "pending" | "accepted" | "declined" | "cancelled";
  createdAt: string;
  cancelledAt?: string;
}

interface TeamPageProps {
  team: TeamResponse;
}

export default function TeamPage({ team }: TeamPageProps) {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [invites, setInvites] = useState<TeamInviteResponse[]>([]);
  const [teamDetails, setTeamDetails] = useState({
    name: team.name,
    tag: team.tag,
    description: team.description,
  });
  const [newCaptainId, setNewCaptainId] = useState<string | undefined>(
    undefined
  );
  const [showChallengeDialog, setShowChallengeDialog] = useState(false);

  // Check if current user is the team captain
  const isCaptain = session?.user?.id === team.captain.discordId;

  useEffect(() => {
    const fetchInvites = async () => {
      if (!isCaptain) return;

      try {
        const response = await fetch(`/api/teams/${team._id}/invites`);
        if (!response.ok) throw new Error("Failed to fetch invites");
        const data = await response.json();
        setInvites(data);
      } catch (error) {
        console.error("Failed to fetch invites:", error);
      }
    };

    // Initial fetch
    fetchInvites();

    // Listen for refresh events
    const handleRefreshInvites = (event: CustomEvent<TeamInviteResponse[]>) => {
      setInvites(event.detail);
    };

    window.addEventListener(
      "refreshInvites",
      handleRefreshInvites as EventListener
    );

    return () => {
      window.removeEventListener(
        "refreshInvites",
        handleRefreshInvites as EventListener
      );
    };
  }, [team._id, isCaptain]);

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!isCaptain) {
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

    setIsLoading(true);
    try {
      const response = await fetch(`/api/teams/${team._id}/remove-member`, {
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
        title: "Member Removed",
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
      setIsLoading(false);
    }
  };

  const handleCancelInvite = async (inviteId: string) => {
    try {
      const response = await fetch(`/api/teams/invites/${inviteId}/cancel`, {
        method: "POST",
      });

      if (!response.ok) throw new Error("Failed to cancel invite");

      // Update invites with proper type handling
      const updatedInvites = invites.map(
        (invite): TeamInviteResponse =>
          invite._id.toString() === inviteId
            ? {
                ...invite,
                status: "cancelled" as const,
                cancelledAt: new Date(), // Keep as Date object
              }
            : invite
      );

      setInvites(updatedInvites);

      toast({
        title: "Invite Cancelled",
        description: "Team invite has been cancelled",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cancel invite",
        variant: "destructive",
      });
    }
  };

  const handleUpdateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`/api/teams/${team._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(teamDetails),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update team");
      }

      toast({
        title: "Success",
        description: "Team details updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to update team",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTransferCaptain = async (newCaptainId: string | undefined) => {
    if (!newCaptainId) {
      toast({
        title: "Error",
        description: "Please select a team member",
        variant: "destructive",
      });
      return;
    }

    if (
      !confirm(
        "Are you sure you want to transfer team captaincy? This cannot be undone."
      )
    ) {
      return;
    }

    setIsLoading(true);
    try {
      console.log("Transferring captain role to:", newCaptainId);

      const response = await fetch(
        `/api/teams/${team._id.toString()}/transfer-captain`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ newCaptainId }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to transfer captain role");
      }

      toast({
        title: "Success",
        description: "Captain role transferred successfully",
      });

      // Reload the page to reflect changes
      window.location.reload();
    } catch (error: any) {
      console.error("Error transferring captain:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to transfer captain role",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const canChallenge = () => {
    if (!session?.user) return false;
    if (team.captain.discordId === session.user.id) return false; // Can't challenge own team
    return true;
  };

  const handleDeleteTeam = async () => {
    if (!isCaptain) {
      toast({
        title: "Permission Denied",
        description: "Only the team captain can delete the team",
        variant: "destructive",
      });
      return;
    }

    // Check if there are other members
    const hasOtherMembers =
      team.members.filter((m) => m.discordId !== team.captain.discordId)
        .length > 0;
    if (hasOtherMembers) {
      toast({
        title: "Cannot Delete Team",
        description:
          "You must remove all other members before deleting the team",
        variant: "destructive",
      });
      return;
    }

    // Confirm deletion
    if (
      !confirm(
        "Are you sure you want to permanently delete this team? This action cannot be undone."
      )
    ) {
      return;
    }

    setIsLoading(true);
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
      setIsLoading(false);
    }
  };

  return (
    <div className="grid gap-6">
      {/* First row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Team Details Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Team Details</CardTitle>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Team ELO</p>
                <p className="text-2xl font-bold">
                  {(typeof team.teamElo === "number"
                    ? team.teamElo
                    : parseInt(team.teamElo || "0")
                  ).toLocaleString()}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isCaptain ? (
              <form onSubmit={handleUpdateTeam} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Team Name</Label>
                  <Input
                    id="name"
                    value={teamDetails.name}
                    onChange={(e) =>
                      setTeamDetails({ ...teamDetails, name: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tag">Team Tag</Label>
                  <Input
                    id="tag"
                    value={teamDetails.tag}
                    onChange={(e) =>
                      setTeamDetails({
                        ...teamDetails,
                        tag: e.target.value.toUpperCase(),
                      })
                    }
                    maxLength={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={teamDetails.description}
                    onChange={(e) =>
                      setTeamDetails({
                        ...teamDetails,
                        description: e.target.value,
                      })
                    }
                  />
                </div>

                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : null}
                  {isLoading ? "Updating..." : "Update Team"}
                </Button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Team Name</Label>
                  <p className="text-sm">{team.name}</p>
                </div>
                <div className="space-y-2">
                  <Label>Team Tag</Label>
                  <p className="text-sm">{team.tag}</p>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <p className="text-sm">{team.description}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Team Members Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Team Members</CardTitle>
              {isCaptain && <InvitePlayerDialog teamId={team._id.toString()} />}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Captain */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <Shield className="w-4 h-4 text-primary" />
                  <div>
                    <p className="font-medium">
                      {team.captain.discordNickname ||
                        team.captain.discordUsername}
                    </p>
                    <p className="text-sm text-muted-foreground">Captain</p>
                  </div>
                </div>
              </div>

              {/* Other Members */}
              {team.members
                .filter(
                  (member: TeamMember) =>
                    member.discordId !== team.captain.discordId
                )
                .sort((a: TeamMember, b: TeamMember) => {
                  if (!a.joinedAt) return -1;
                  if (!b.joinedAt) return 1;

                  const dateA =
                    typeof a.joinedAt === "string"
                      ? new Date(a.joinedAt).getTime()
                      : a.joinedAt.getTime();
                  const dateB =
                    typeof b.joinedAt === "string"
                      ? new Date(b.joinedAt).getTime()
                      : b.joinedAt.getTime();

                  return dateA - dateB;
                })
                .map((member: TeamMember) => (
                  <div
                    key={member.discordId}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-medium">
                          {member.discordNickname || member.discordUsername}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {member.role === "substitute"
                            ? "Substitute"
                            : "Member"}
                        </p>
                      </div>
                    </div>
                    {isCaptain && (
                      <div className="flex gap-2">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() =>
                            handleRemoveMember(
                              member.discordId,
                              member.discordNickname ||
                                member.discordUsername ||
                                "Unknown Member"
                            )
                          }
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            "Remove"
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Captain Transfer Card */}
      {isCaptain && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Transfer Captain Role
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                This will transfer your captain privileges to another team
                member. This action cannot be undone.
              </p>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                <div className="w-full space-y-2 sm:w-auto">
                  <Label htmlFor="new-captain">New Captain</Label>
                  <Select
                    value={newCaptainId}
                    onValueChange={(value) => setNewCaptainId(value)}
                    disabled={isLoading}
                  >
                    <SelectTrigger
                      id="new-captain"
                      className="w-full sm:w-[250px]"
                    >
                      <SelectValue placeholder="Select new captain" />
                    </SelectTrigger>
                    <SelectContent>
                      {team.members
                        .filter(
                          (member) =>
                            member.discordId !== team.captain.discordId &&
                            member.discordId
                        )
                        .map((member) => (
                          <SelectItem
                            key={member.discordId}
                            value={member.discordId}
                          >
                            {member.discordNickname ||
                              member.discordUsername ||
                              "Unknown member"}
                          </SelectItem>
                        ))}
                      {team.members.filter(
                        (m) => m.discordId !== team.captain.discordId
                      ).length === 0 && (
                        <SelectItem value="none" disabled>
                          No eligible members found
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Transfer button with debugging information */}
                <Button
                  onClick={() => {
                    console.log(
                      "Transfer captain initiated with ID:",
                      newCaptainId
                    );
                    if (newCaptainId) {
                      handleTransferCaptain(newCaptainId);
                    } else {
                      toast({
                        title: "Selection Required",
                        description: "Please select a team member first",
                      });
                    }
                  }}
                  disabled={!newCaptainId || isLoading}
                  className="w-full sm:w-auto"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
                      Transferring...
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4 mr-2" /> Transfer Captain Role
                    </>
                  )}
                </Button>
              </div>

              {/* Selected member display */}
              {newCaptainId && (
                <div className="p-3 text-sm rounded bg-accent/50">
                  <p>
                    Selected:{" "}
                    {team.members.find((m) => m.discordId === newCaptainId)
                      ?.discordNickname ||
                      team.members.find((m) => m.discordId === newCaptainId)
                        ?.discordUsername ||
                      newCaptainId}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete Team Card - Only shown to captain with no other members */}
      {isCaptain &&
        team.members.filter((m) => m.discordId !== team.captain.discordId)
          .length === 0 && (
          <Card className="mt-6 border-red-800">
            <CardHeader className="bg-red-900/20">
              <CardTitle className="flex items-center gap-2 text-red-500">
                <AlertCircle className="w-5 h-5" />
                Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="p-4 border border-red-800 rounded-md bg-red-900/10">
                  <h3 className="mb-2 font-semibold text-red-500">
                    Delete Team
                  </h3>
                  <p className="mb-4 text-sm text-muted-foreground">
                    Since you have no other team members, you can permanently
                    delete this team. This action cannot be undone.
                  </p>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteTeam}
                    disabled={isLoading}
                    className="w-full sm:w-auto"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
                        Deleting...
                      </>
                    ) : (
                      "Delete Team Permanently"
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

      {/* Team Management Card - Bottom Row */}
      {isCaptain && (
        <Card>
          <CardHeader>
            <CardTitle>Team Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Recent Invites</h3>
              {invites.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No invites to show
                </p>
              ) : (
                <div className="space-y-2">
                  {invites.map((invite) => (
                    <div
                      key={invite._id.toString()}
                      className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                    >
                      <div>
                        <p className="font-medium">{invite.inviteeName}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>
                            {format(new Date(invite.createdAt), "MMM d, yyyy")}
                          </span>
                          <span>•</span>
                          <span
                            className={cn(
                              "capitalize",
                              invite.status === "pending" && "text-yellow-500",
                              invite.status === "accepted" && "text-green-500",
                              invite.status === "declined" && "text-red-500",
                              invite.status === "cancelled" && "text-gray-500"
                            )}
                          >
                            {invite.status}
                          </span>
                        </div>
                      </div>
                      {invite.status === "pending" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleCancelInvite(invite._id.toString())
                          }
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Team Members Management Card */}
      {isCaptain && team.members.length > 1 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Manage Team Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Team Members</h3>
              <div className="space-y-2">
                {team.members
                  .filter(
                    (member) => member.discordId !== team.captain.discordId
                  )
                  .map((member) => (
                    <div
                      key={member.discordId}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div>
                        <p className="font-medium">
                          {member.discordNickname ||
                            member.discordUsername ||
                            "Unknown member"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {member.role || "member"}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() =>
                            handleRemoveMember(
                              member.discordId,
                              member.discordNickname ||
                                member.discordUsername ||
                                "Unknown Member"
                            )
                          }
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            "Remove"
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setNewCaptainId(member.discordId);
                            document
                              .getElementById("new-captain")
                              ?.scrollIntoView({ behavior: "smooth" });
                            toast({
                              title: "Member Selected",
                              description: `${
                                member.discordNickname || member.discordUsername
                              } selected for captain role transfer`,
                            });
                          }}
                        >
                          Make Captain
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!isCaptain && session?.user?.id && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-red-500">Leave Team</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                If you leave this team, you&apos;ll need to be invited again to
                rejoin.
              </p>
              <Button
                variant="destructive"
                onClick={async () => {
                  if (!confirm("Are you sure you want to leave this team?")) {
                    return;
                  }

                  setIsLoading(true);
                  try {
                    const response = await fetch(
                      `/api/teams/${team._id}/leave`,
                      {
                        method: "POST",
                      }
                    );

                    if (!response.ok) {
                      const data = await response.json();
                      throw new Error(data.error || "Failed to leave team");
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
                      description: error.message || "Failed to leave team",
                      variant: "destructive",
                    });
                  } finally {
                    setIsLoading(false);
                  }
                }}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Leaving...
                  </>
                ) : (
                  "Leave Team"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
