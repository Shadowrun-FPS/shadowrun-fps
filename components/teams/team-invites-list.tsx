"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, X, Loader2, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface TeamInvite {
  id: string;
  inviteeName: string;
  inviterName: string;
  inviterNickname?: string;
  status: string;
  createdAt: string;
}

interface Team {
  _id: string;
  captain: {
    discordId: string;
  };
}

interface TeamInvitesListProps {
  teamId: string;
  isCaptain?: boolean;
}

export function TeamInvitesList({
  teamId,
  isCaptain = false,
}: TeamInvitesListProps) {
  const { data: session } = useSession();
  const [invites, setInvites] = useState<TeamInvite[]>([]);
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<Record<string, boolean>>({});
  const [clearingAll, setClearingAll] = useState(false);
  const [cancellingPending, setCancellingPending] = useState(false);
  const [clearingCompleted, setClearingCompleted] = useState(false);
  const { toast } = useToast();

  const fetchInvites = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch team data to get captain ID
      const teamResponse = await fetch(`/api/teams/${teamId}`);
      if (!teamResponse.ok) {
        throw new Error("Failed to fetch team data");
      }
      const teamData = await teamResponse.json();
      setTeam(teamData);

      // Fetch invites
      const invitesResponse = await fetch(`/api/teams/${teamId}/invites`);
      if (!invitesResponse.ok) {
        throw new Error("Failed to fetch invites");
      }

      const data = await invitesResponse.json();
      setInvites(data.invites);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load team data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [teamId, toast]);

  useEffect(() => {
    fetchInvites();
  }, [fetchInvites]);

  const handleCancelInvite = async (inviteId: string) => {
    setCancelling((prev) => ({ ...prev, [inviteId]: true }));

    try {
      const response = await fetch(`/api/teams/invites/${inviteId}/cancel`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to cancel invite");
      }

      // Update the invite status locally
      setInvites((prevInvites) =>
        prevInvites.map((invite) =>
          invite.id === inviteId ? { ...invite, status: "cancelled" } : invite
        )
      );

      toast({
        title: "Invite Cancelled",
        description: "The invite has been cancelled successfully",
      });
    } catch (error: any) {
      console.error("Error cancelling invite:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to cancel invite",
        variant: "destructive",
      });
    } finally {
      setCancelling((prev) => ({ ...prev, [inviteId]: false }));
    }
  };

  const handleClearAllInvites = async () => {
    setClearingAll(true);
    try {
      const response = await fetch(`/api/teams/${teamId}/invites/clear`, {
        method: "POST",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to clear invites");
      }

      // Only consume the response body once
      const data = await response.json();

      // Update all invites to cancelled
      setInvites([]); // Just clear the invites array completely

      // Optionally refresh the invites instead
      // await fetchInvites();

      toast({
        title: "Invites Cleared",
        description: data.message || "All invites have been cleared",
      });
    } catch (error: any) {
      console.error("Error clearing invites:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to clear invites",
        variant: "destructive",
      });
    } finally {
      setClearingAll(false);
    }
  };

  const handleCancelPendingInvites = async () => {
    if (!confirm("Are you sure you want to cancel all pending invites?")) {
      return;
    }

    setCancellingPending(true);
    try {
      const response = await fetch(`/api/teams/${teamId}/invites/clear`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "cancel_pending",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to cancel pending invites");
      }

      const data = await response.json();

      // Update all pending invites to cancelled in the UI
      setInvites((prevInvites) =>
        prevInvites.map((invite) =>
          invite.status === "pending"
            ? { ...invite, status: "cancelled" }
            : invite
        )
      );

      toast({
        title: "Pending Invites Cancelled",
        description: data.message || "All pending invites have been cancelled",
      });
    } catch (error: any) {
      console.error("Error cancelling pending invites:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to cancel pending invites",
        variant: "destructive",
      });
    } finally {
      setCancellingPending(false);
    }
  };

  const handleClearCompletedInvites = async () => {
    if (
      !confirm(
        "Are you sure you want to permanently delete all completed, rejected, and cancelled invites?"
      )
    ) {
      return;
    }

    setClearingCompleted(true);
    try {
      const response = await fetch(`/api/teams/${teamId}/invites/clear`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "delete_completed",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Failed to delete completed invites"
        );
      }

      const data = await response.json();

      // Remove all non-pending invites from the UI
      setInvites((prevInvites) =>
        prevInvites.filter((invite) => invite.status === "pending")
      );

      toast({
        title: "Completed Invites Deleted",
        description: data.message || "All completed invites have been deleted",
      });
    } catch (error: any) {
      console.error("Error deleting completed invites:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete completed invites",
        variant: "destructive",
      });
    } finally {
      setClearingCompleted(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge
            variant="outline"
            className="text-yellow-500 bg-yellow-500/10 border-yellow-500/20"
          >
            Pending
          </Badge>
        );
      case "accepted":
        return (
          <Badge
            variant="outline"
            className="text-green-500 bg-green-500/10 border-green-500/20"
          >
            Accepted
          </Badge>
        );
      case "rejected":
        return (
          <Badge
            variant="outline"
            className="text-red-500 bg-red-500/10 border-red-500/20"
          >
            Rejected
          </Badge>
        );
      case "cancelled":
        return (
          <Badge
            variant="outline"
            className="text-gray-500 bg-gray-500/10 border-gray-500/20"
          >
            Cancelled
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Check if current user is team captain (renamed to avoid conflict with prop)
  const userIsCaptain =
    team?.captain && session?.user?.id === team.captain.discordId;

  // Use the isCaptain from props or userIsCaptain if available
  const showCaptainControls = isCaptain || userIsCaptain;

  // Check if there are any pending invites
  const hasPendingInvites = invites.some(
    (invite) => invite.status === "pending"
  );

  // Filter to show most recent invites first
  const sortedInvites = [...invites].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Mail className="w-5 h-5 mr-2" /> Recent Invites
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center p-4">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Recent Invites
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Manage your team&apos;s invitations
          </p>
        </div>
        {showCaptainControls && (
          <div className="flex gap-2">
            {invites.some((invite) => invite.status === "pending") && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancelPendingInvites}
                disabled={cancellingPending}
              >
                {cancellingPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  <>
                    <X className="w-4 h-4 mr-2" />
                    Cancel Pending
                  </>
                )}
              </Button>
            )}

            {invites.some((invite) =>
              ["completed", "cancelled", "rejected"].includes(invite.status)
            ) && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearCompletedInvites}
                disabled={clearingCompleted}
              >
                {clearingCompleted ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete History
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent>
        {sortedInvites.length === 0 ? (
          <p className="py-4 text-sm text-center text-muted-foreground">
            No invites have been sent yet
          </p>
        ) : (
          <div className="space-y-2">
            {sortedInvites.map((invite) => (
              <div
                key={invite.id}
                className="flex items-center justify-between p-3 border rounded-md bg-card"
              >
                <div>
                  <div className="font-medium">{invite.inviteeName}</div>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <p>
                      Invited by: {invite.inviterNickname || invite.inviterName}
                    </p>
                    <p>Date: {formatDate(invite.createdAt)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {getStatusBadge(invite.status)}

                  {showCaptainControls && invite.status === "pending" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-8 h-8"
                      onClick={() => handleCancelInvite(invite.id)}
                      disabled={cancelling[invite.id]}
                    >
                      {cancelling[invite.id] ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <X className="w-4 h-4" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
