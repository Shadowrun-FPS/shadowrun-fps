"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { InvitePlayerDialog } from "@/components/teams/invite-player-dialog";
import { Loader2, Shield } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { safeLog } from "@/lib/security";

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

const panelClass =
  "rounded-xl border-2 border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 shadow-sm";

export default function TeamDetailsClient({ team }: { team: Team }) {
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [invites, setInvites] = useState<TeamInvite[]>([]);
  const [rosterMembers, setRosterMembers] = useState<TeamMember[]>(team.members);

  const isCaptain = session?.user?.id === team.captain.discordId;

  useEffect(() => {
    setRosterMembers(team.members);
  }, [team]);

  const refetchInvites = useCallback(async () => {
    try {
      const response = await fetch(`/api/teams/${team._id}/invites`);
      if (!response.ok) throw new Error("Failed to fetch invites");
      const data = await response.json();
      setInvites(data);
    } catch (error) {
      safeLog.error("Failed to fetch invites:", error);
    }
  }, [team._id]);

  useEffect(() => {
    void refetchInvites();
  }, [refetchInvites]);

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
      const response = await fetch(`/api/teams/${team._id}/members/${memberId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to remove member");

      setRosterMembers((prev) => prev.filter((m) => m.discordId !== memberId));
      toast({
        title: "Member Removed",
        description: "Team member has been removed successfully",
      });
      router.refresh();
    } catch (error) {
      safeLog.error("Remove member failed:", error);
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
      safeLog.error("Cancel invite failed:", error);
      toast({
        title: "Error",
        description: "Failed to cancel invite",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card className={panelClass}>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-lg">Team members</CardTitle>
            {isCaptain && <InvitePlayerDialog teamId={team._id.toString()} />}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border border-border/60 bg-background/40 p-3">
              <div className="flex items-center gap-3">
                <Shield className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                <div>
                  <p className="font-medium">
                    {team.captain.discordNickname || team.captain.discordUsername}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {team.captain.discordUsername} · Captain
                  </p>
                </div>
              </div>
            </div>

            {rosterMembers
              .filter((member) => member.discordId !== team.captain.discordId)
              .sort(
                (a, b) =>
                  new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime()
              )
              .map((member) => (
                <div
                  key={member.discordId}
                  className="flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-background/40 p-3"
                >
                  <div className="min-w-0">
                    <p className="font-medium">
                      {member.discordNickname || member.discordUsername}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {member.discordUsername}
                      {member.role === "captain" && " · Captain"}
                    </p>
                  </div>
                  {isCaptain && (
                    <Button
                      variant="destructive"
                      size="sm"
                      className="shrink-0"
                      onClick={() => handleRemoveMember(member.discordId)}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
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

      <Card className={panelClass}>
        <CardHeader>
          <CardTitle className="text-lg">Team management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Recent invites
            </h3>
            {invites.length === 0 ? (
              <p className="text-sm text-muted-foreground">No invites to show.</p>
            ) : (
              <div className="space-y-2">
                {invites.map((invite) => (
                  <div
                    key={invite._id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/60 bg-background/40 p-3"
                  >
                    <div className="min-w-0">
                      <p className="font-medium">{invite.inviteeName}</p>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        <span>{format(new Date(invite.createdAt), "MMM d, yyyy")}</span>
                        <span aria-hidden>·</span>
                        <span
                          className={cn(
                            "capitalize",
                            invite.status === "pending" && "text-primary",
                            invite.status === "accepted" && "text-emerald-600 dark:text-emerald-400",
                            invite.status === "declined" && "text-destructive",
                            invite.status === "cancelled" && "text-muted-foreground"
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
                        className="border-primary/25"
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
