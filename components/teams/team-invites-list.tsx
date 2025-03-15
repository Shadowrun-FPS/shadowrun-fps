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
}

export function TeamInvitesList({ teamId }: TeamInvitesListProps) {
  const { data: session } = useSession();
  const [invites, setInvites] = useState<TeamInvite[]>([]);
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<Record<string, boolean>>({});
  const [clearingAll, setClearingAll] = useState(false);
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
        const data = await response.json();
        throw new Error(data.error || "Failed to clear invites");
      }

      const data = await response.json();

      // Update all pending invites to cancelled
      setInvites((prevInvites) =>
        prevInvites.map((invite) =>
          invite.status === "pending"
            ? { ...invite, status: "cancelled" }
            : invite
        )
      );

      toast({
        title: "Invites Cleared",
        description: data.message || "All pending invites have been cancelled",
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

  // Check if current user is team captain
  const isCaptain =
    team?.captain && session?.user?.id === team.captain.discordId;

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
      <CardHeader>
        <div className="flex items-center gap-2">
          <Mail className="w-5 h-5" />
          <CardTitle>Recent Invites</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">
          Manage your team&apos;s invitations
        </p>
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
                    <p>Invited by: {invite.inviterName}</p>
                    <p>Date: {formatDate(invite.createdAt)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {getStatusBadge(invite.status)}

                  {isCaptain && invite.status === "pending" && (
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
