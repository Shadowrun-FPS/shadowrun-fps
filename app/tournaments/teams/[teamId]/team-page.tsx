"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { InvitePlayerDialog } from "@/components/teams/invite-player-dialog";
import { Loader2, Shield } from "lucide-react";
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

  const handleRemoveMember = async (memberId: string) => {
    if (!isCaptain) {
      toast({
        title: "Permission Denied",
        description: "Only the team captain can remove members",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/teams/${team._id}/members/${memberId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) throw new Error("Failed to remove member");

      toast({
        title: "Member Removed",
        description: "Team member has been removed successfully",
      });

      // Refresh the page
      window.location.reload();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove team member",
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

  const handleTransferCaptain = async (newCaptainId: string) => {
    if (!isCaptain) {
      toast({
        title: "Permission Denied",
        description: "Only the team captain can transfer leadership",
        variant: "destructive",
      });
      return;
    }

    if (!window.confirm("Are you sure you want to transfer team leadership?")) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/teams/${team._id}/transfer-captain/${newCaptainId}`,
        {
          method: "POST",
        }
      );

      if (!response.ok) throw new Error("Failed to transfer leadership");

      toast({
        title: "Leadership Transferred",
        description: "Team leadership has been transferred successfully",
      });

      // Refresh the page
      window.location.reload();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to transfer team leadership",
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
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          if (
                            window.confirm(
                              "Are you sure you want to remove this member?"
                            )
                          ) {
                            handleRemoveMember(member.discordId);
                          }
                        }}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          "Remove"
                        )}
                      </Button>
                    )}
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transfer Captain Card - Middle Row */}
      {isCaptain && (
        <Card>
          <CardHeader>
            <CardTitle>Transfer Team Leadership</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Select
                onValueChange={(value) => handleTransferCaptain(value)}
                disabled={isLoading}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select new captain" />
                </SelectTrigger>
                <SelectContent>
                  {team.members
                    .filter(
                      (member) =>
                        member.discordId !== team.captain.discordId &&
                        member.role !== "substitute"
                    )
                    .map((member) => (
                      <SelectItem
                        key={member.discordId}
                        value={member.discordId}
                      >
                        {member.discordNickname || member.discordUsername}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
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
    </div>
  );
}
