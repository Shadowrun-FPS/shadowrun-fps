"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { InvitePlayerDialog } from "@/components/teams/invite-player-dialog";
import { Loader2, Shield } from "lucide-react";
import type { MongoTeam } from "@/types/mongodb";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface TeamInvite {
  _id: string;
  inviteeId: string;
  inviteeName: string;
  status: "pending" | "accepted" | "declined" | "cancelled";
  createdAt: string;
  cancelledAt?: string;
}

interface TeamMember {
  discordId: string;
  discordUsername: string;
  discordNickname: string;
  role: string;
  joinedAt: string;
}

interface Team {
  _id: string;
  name: string;
  tag: string;
  description: string;
  captain: {
    discordId: string;
    discordUsername: string;
    discordNickname: string;
  };
  members: TeamMember[];
  elo?: number;
  wins?: number;
  losses?: number;
  createdAt: string;
  updatedAt: string;
}

export default function TeamDetailsClient({ team }: { team: Team }) {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [teamDetails, setTeamDetails] = useState({
    name: team.name,
    tag: team.tag,
    description: team.description,
  });
  const [invites, setInvites] = useState<TeamInvite[]>([]);

  // Check if current user is the team captain
  const isCaptain = session?.user?.id === team.captain.discordId;

  useEffect(() => {
    const fetchInvites = async () => {
      try {
        const response = await fetch(`/api/teams/${team._id}/invites`);
        if (!response.ok) throw new Error("Failed to fetch invites");
        const data = await response.json();
        setInvites(data);
      } catch (error) {
        console.error("Failed to fetch invites:", error);
      }
    };

    fetchInvites();
  }, [team._id]);

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

  const handleCancelInvite = async (inviteId: string) => {
    try {
      const response = await fetch(`/api/teams/invites/${inviteId}/cancel`, {
        method: "POST",
      });

      if (!response.ok) throw new Error("Failed to cancel invite");

      // Refresh invites with proper typing
      const updatedInvites = invites.map((invite) =>
        invite._id === inviteId
          ? {
              ...invite,
              status: "cancelled" as const,
              cancelledAt: new Date().toISOString(),
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

  return (
    <div className="space-y-6">
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
                  <p className="text-sm text-muted-foreground">
                    {team.captain.discordUsername} • Captain
                  </p>
                </div>
              </div>
            </div>

            {/* Other Members */}
            {team.members
              .filter((member) => member.discordId !== team.captain.discordId)
              .sort(
                (a, b) =>
                  new Date(a.joinedAt).getTime() -
                  new Date(b.joinedAt).getTime()
              )
              .map((member) => (
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
                        {member.discordUsername}
                        {member.role === "captain" && " • Captain"}
                      </p>
                    </div>
                  </div>
                  {isCaptain && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemoveMember(member.discordId)}
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
                    key={invite._id}
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
                        onClick={() => handleCancelInvite(invite._id)}
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
    </div>
  );
}
