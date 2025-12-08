"use client";

import { useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X, Loader2, Users, AlertTriangle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface TeamInviteCardProps {
  id: string;
  teamId: string;
  teamName: string;
  inviterName: string;
  inviterNickname: string;
  createdAt: string;
  onInviteProcessed?: () => void;
}

export function TeamInviteCard({
  id,
  teamId,
  teamName,
  inviterName,
  inviterNickname,
  createdAt,
  onInviteProcessed,
}: TeamInviteCardProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [processed, setProcessed] = useState(false);
  const [status, setStatus] = useState<"pending" | "accepted" | "rejected">(
    "pending"
  );
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [currentTeam, setCurrentTeam] = useState<{
    _id: string;
    name: string;
  } | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const checkCurrentTeam = async () => {
    try {
      const response = await fetch("/api/teams/my-team");
      if (response.ok) {
        const data = await response.json();
        return data.team;
      }
      return null;
    } catch (error) {
      console.error("Error checking current team:", error);
      return null;
    }
  };

  const handleAction = async (action: "accept" | "reject") => {
    if (action === "accept") {
      // Check if user is already in a team
      const team = await checkCurrentTeam();
      if (team && team._id !== teamId) {
        setCurrentTeam(team);
        setConfirmDialogOpen(true);
        return;
      }
    }

    await processAction(action);
  };

  const processAction = async (
    action: "accept" | "reject",
    leaveCurrentTeam: boolean = false
  ) => {
    if (isSubmitting) return; // Prevent duplicate submissions
    setIsSubmitting(true);
    try {
      // If we need to leave current team first
      if (leaveCurrentTeam && currentTeam) {
        const leaveResponse = await fetch(
          `/api/teams/${currentTeam._id}/leave`,
          {
            method: "POST",
          }
        );

        if (!leaveResponse.ok) {
          const leaveError = await leaveResponse.json();
          throw new Error(leaveError.error || "Failed to leave current team");
        }

        toast({
          title: "Left Team",
          description: `You have left ${currentTeam.name}`,
        });
      }

      const response = await fetch(`/api/teams/invites/${id}/respond`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to process invite");
      }

      const statusValue = action === "accept" ? "accepted" : "rejected";
      setStatus(statusValue);
      setProcessed(true);

      toast({
        title: action === "accept" ? "Team Joined" : "Invite Rejected",
        description: data.message,
        variant: action === "accept" ? "default" : "destructive",
      });

      if (action === "accept") {
        // Redirect to team page
        setTimeout(() => {
          router.push(`/tournaments/teams/${teamId}`);
          router.refresh();
        }, 1500);
      }

      if (onInviteProcessed) {
        onInviteProcessed();
      }
    } catch (error: any) {
      if (process.env.NODE_ENV === "development") {
        console.error(`Error ${action}ing invite:`, error);
      }
      toast({
        title: "Error",
        description: error.message || `Failed to ${action} invite`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setConfirmDialogOpen(false);
    }
  };

  return (
    <>
      <Card className="mb-4">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Team Invite</h3>
          </div>

          <p className="mb-1 text-sm">
            You have been invited to join team{" "}
            <span className="font-semibold">{teamName}</span>
          </p>

          <div className="mt-2 space-y-1 text-xs text-muted-foreground">
            <p>Invited by: {inviterNickname || inviterName}</p>
            <p>Date: {formatDate(createdAt)}</p>
          </div>
        </CardContent>

        {!processed && (
          <CardFooter className="flex justify-end gap-2 pt-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleAction("reject")}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <X className="w-4 h-4 mr-2" />
              )}
              Decline
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => handleAction("accept")}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              Accept
            </Button>
          </CardFooter>
        )}

        {processed && (
          <CardFooter className="pt-2">
            <p className="w-full py-2 text-sm text-center">
              {status === "accepted" ? (
                <span className="font-medium text-green-500">
                  Invite accepted. Joining team...
                </span>
              ) : (
                <span className="text-muted-foreground">Invite declined</span>
              )}
            </p>
          </CardFooter>
        )}
      </Card>

      {/* Confirmation Dialog for leaving current team */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Already in a Team
            </DialogTitle>
            <DialogDescription>
              You are already a member of <strong>{currentTeam?.name}</strong>.
              To join {teamName}, you must leave your current team.
            </DialogDescription>
          </DialogHeader>
          <div className="p-3 mt-2 rounded-md bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 text-sm">
            <p>
              You can only be a member of one team at a time. Leaving your
              current team will remove you from that roster.
            </p>
          </div>
          <DialogFooter className="gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setConfirmDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => processAction("accept", true)}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                "Leave & Join New Team"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
