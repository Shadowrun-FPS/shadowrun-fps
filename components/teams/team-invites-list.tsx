"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Mail,
  X,
  Loader2,
  Trash2,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
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
import { safeLog } from "@/lib/security";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  const [showCancelPendingDialog, setShowCancelPendingDialog] = useState(false);
  const [invitesOpen, setInvitesOpen] = useState(false);
  const [deletingInviteId, setDeletingInviteId] = useState<string | null>(null);
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
      safeLog.error("Error fetching team invites:", error);
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
          invite.id === inviteId ? { ...invite, status: "cancelled" } : invite,
        ),
      );

      toast({
        title: "Invite Cancelled",
        description: "The invite has been cancelled successfully",
      });
    } catch (error: unknown) {
      safeLog.error("Error cancelling invite:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to cancel invite",
        variant: "destructive",
      });
    } finally {
      setCancelling((prev) => ({ ...prev, [inviteId]: false }));
    }
  };

  const handleRemoveInvite = async (inviteId: string) => {
    setDeletingInviteId(inviteId);
    try {
      const response = await fetch(`/api/teams/invites/${inviteId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to remove invite");
      }

      setInvites((prev) => prev.filter((inv) => inv.id !== inviteId));
      toast({
        title: "Invite Removed",
        description: "The invite has been removed from the list",
      });
    } catch (error: unknown) {
      safeLog.error("Error removing invite:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to remove invite",
        variant: "destructive",
      });
    } finally {
      setDeletingInviteId(null);
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
    } catch (error: unknown) {
      safeLog.error("Error clearing invites:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to clear invites",
        variant: "destructive",
      });
    } finally {
      setClearingAll(false);
    }
  };

  const handleCancelPendingInvites = async () => {
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
            : invite,
        ),
      );

      toast({
        title: "Pending Invites Cancelled",
        description: data.message || "All pending invites have been cancelled",
      });
    } catch (error: unknown) {
      safeLog.error("Error cancelling pending invites:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to cancel pending invites",
        variant: "destructive",
      });
    } finally {
      setCancellingPending(false);
    }
  };

  const handleClearCompletedInvites = async () => {
    if (
      !confirm(
        "Are you sure you want to permanently delete all completed, rejected, and cancelled invites?",
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
          errorData.error || "Failed to delete completed invites",
        );
      }

      const data = await response.json();

      // Remove all non-pending invites from the UI
      setInvites((prevInvites) =>
        prevInvites.filter((invite) => invite.status === "pending"),
      );

      toast({
        title: "Completed Invites Deleted",
        description: data.message || "All completed invites have been deleted",
      });
    } catch (error: unknown) {
      safeLog.error("Error deleting completed invites:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to delete completed invites",
        variant: "destructive",
      });
    } finally {
      setClearingCompleted(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Check if date is today
    if (date.toDateString() === today.toDateString()) {
      return "Today";
    }

    // Check if date is yesterday
    if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    }

    // Otherwise return formatted date
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
            className="rounded-full border-yellow-500/30 bg-yellow-500/20 px-2.5 py-1 font-medium text-yellow-600 dark:text-yellow-400"
          >
            Pending
          </Badge>
        );
      case "accepted":
        return (
          <Badge
            variant="outline"
            className="rounded-full border-green-500/30 bg-green-500/20 px-2.5 py-1 font-medium text-green-600 dark:text-green-400"
          >
            Accepted
          </Badge>
        );
      case "rejected":
        return (
          <Badge
            variant="outline"
            className="rounded-full border-red-500/30 bg-red-500/20 px-2.5 py-1 font-medium text-red-600 dark:text-red-400"
          >
            Rejected
          </Badge>
        );
      case "cancelled":
        return (
          <Badge
            variant="outline"
            className="rounded-full border-gray-500/30 bg-gray-500/20 px-2.5 py-1 font-medium text-gray-600 dark:text-gray-400"
          >
            Cancelled
          </Badge>
        );
      case "left":
        return (
          <Badge
            variant="outline"
            className="rounded-full border-amber-500/30 bg-amber-500/20 px-2.5 py-1 font-medium text-amber-600 dark:text-amber-400"
          >
            Left team
          </Badge>
        );
      default:
        return (
          <Badge
            variant="outline"
            className="rounded-full px-2.5 py-1 font-medium"
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        );
    }
  };

  // Check if current user is team captain (renamed to avoid conflict with prop)
  const userIsCaptain =
    team?.captain && session?.user?.id === team.captain.discordId;

  // Use the isCaptain from props or userIsCaptain if available
  const showCaptainControls = isCaptain || userIsCaptain;

  // Check if there are any pending invites
  const hasPendingInvites = invites.some(
    (invite) => invite.status === "pending",
  );

  // Filter to show most recent invites first
  const sortedInvites = [...invites].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  if (loading) {
    return (
      <Card className="border-0 shadow-none bg-transparent">
        <CardHeader className="px-0">
          <CardTitle className="flex flex-wrap items-center gap-2 text-lg font-semibold tracking-tight">
            <Mail className="h-5 w-5 shrink-0 text-primary" aria-hidden />
            Recent invites
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <div className="flex justify-center p-4">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider delayDuration={300}>
      <Card className="border-0 shadow-none bg-transparent">
        <Collapsible open={invitesOpen} onOpenChange={setInvitesOpen}>
          <CardHeader className="space-y-4 px-0 pb-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-6">
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="min-w-0 flex-1 rounded-lg text-left outline-none ring-offset-background transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  id="recent-invites-heading"
                >
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="inline-flex min-w-0 flex-wrap items-center gap-2">
                      <Mail
                        className="h-5 w-5 shrink-0 text-primary"
                        aria-hidden
                      />
                      <span className="text-lg font-semibold tracking-tight">
                        Recent invites
                      </span>
                      {sortedInvites.length > 0 ? (
                        <Badge
                          variant="secondary"
                          className="rounded-full px-2.5 py-0 text-xs font-medium tabular-nums"
                        >
                          {sortedInvites.length}
                        </Badge>
                      ) : null}
                    </span>
                    {invitesOpen ? (
                      <ChevronDown
                        className="h-5 w-5 shrink-0 text-muted-foreground"
                        aria-hidden
                      />
                    ) : (
                      <ChevronRight
                        className="h-5 w-5 shrink-0 text-muted-foreground"
                        aria-hidden
                      />
                    )}
                  </div>
                  <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted-foreground">
                    Manage your team&apos;s invitations
                  </p>
                </button>
              </CollapsibleTrigger>
              {invitesOpen && showCaptainControls && (
                <div
                  className="flex w-full flex-wrap gap-2 lg:w-auto lg:shrink-0 lg:justify-end"
                  onClick={(e) => e.stopPropagation()}
                >
                  {invites.some((invite) => invite.status === "pending") && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowCancelPendingDialog(true)}
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
                      <AlertDialog
                        open={showCancelPendingDialog}
                        onOpenChange={setShowCancelPendingDialog}
                      >
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Cancel All Pending Invites?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to cancel all pending
                              invites? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => {
                                setShowCancelPendingDialog(false);
                                handleCancelPendingInvites();
                              }}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Cancel All Invites
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  )}

                  {invites.some((invite) =>
                    ["completed", "cancelled", "rejected", "left"].includes(
                      invite.status,
                    ),
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
            </div>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="px-0">
              {sortedInvites.length === 0 ? (
                <div className="py-6 sm:py-8 flex flex-col items-center gap-4 text-center">
                  <div className="p-3 rounded-full bg-muted/40">
                    <Mail className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="mb-1 text-sm font-medium text-foreground">
                      No invites have been sent yet
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {showCaptainControls
                        ? "Invite players to join your team"
                        : "This team hasn't sent any invites yet"}
                    </p>
                  </div>
                  {showCaptainControls && (
                    <Button
                      size="sm"
                      className="focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                      onClick={() => {
                        if (typeof window !== "undefined") {
                          window.dispatchEvent(
                            new CustomEvent("openInviteModal", {
                              detail: { teamId },
                            }),
                          );
                        }
                      }}
                    >
                      <Mail className="mr-2 w-4 h-4" />
                      Send first invite
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {sortedInvites.map((invite) => (
                    <div
                      key={invite.id}
                      className="flex flex-col gap-4 rounded-xl border border-border/50 bg-muted/10 p-4 transition-colors hover:border-border hover:bg-muted/15 sm:flex-row sm:items-start sm:justify-between sm:gap-6"
                    >
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="text-base font-semibold text-foreground">
                          {invite.inviteeName}
                        </div>
                        <div className="space-y-1.5 text-sm text-muted-foreground">
                          <p className="break-words">
                            <span className="text-muted-foreground">
                              Invited by{" "}
                            </span>
                            <span className="font-medium text-foreground">
                              {invite.inviterNickname || invite.inviterName}
                            </span>
                          </p>
                          <p className="text-muted-foreground">
                            Sent {formatDate(invite.createdAt)}
                          </p>
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-row flex-wrap items-center justify-end gap-2 sm:flex-col sm:items-end">
                        {getStatusBadge(invite.status)}

                        {showCaptainControls && invite.status === "pending" && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="w-8 h-8 hover:bg-destructive/10 hover:text-destructive"
                                disabled={cancelling[invite.id]}
                              >
                                {cancelling[invite.id] ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <X className="w-4 h-4" />
                                )}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Cancel Invite?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to cancel the invite for{" "}
                                  <strong>{invite.inviteeName}</strong>? This
                                  will prevent them from joining your team. This
                                  action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>
                                  Keep Invite
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleCancelInvite(invite.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Cancel Invite
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}

                        {showCaptainControls && (
                          <AlertDialog>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="w-8 h-8 hover:bg-muted text-muted-foreground hover:text-foreground"
                                    disabled={deletingInviteId === invite.id}
                                    aria-label={`Remove ${invite.inviteeName} from list`}
                                  >
                                    {deletingInviteId === invite.id ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <Trash2 className="w-4 h-4" />
                                    )}
                                  </Button>
                                </AlertDialogTrigger>
                              </TooltipTrigger>
                              <TooltipContent
                                side="top"
                                className="max-w-[260px] text-center"
                              >
                                <p>
                                  Removes this row from Recent invites only. It
                                  does not remove anyone from the team roster.
                                </p>
                              </TooltipContent>
                            </Tooltip>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Remove invite from list?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Remove the invite for{" "}
                                  <strong>{invite.inviteeName}</strong> from
                                  Recent Invites? This does not affect the team
                                  roster. This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Keep</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleRemoveInvite(invite.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Remove
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </TooltipProvider>
  );
}
