"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  Settings,
  Loader2,
  X,
  ArrowLeft,
  UserPlus,
  AlertCircle,
  Mail,
  UserMinus,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TeamInvitesList } from "@/components/teams/team-invites-list";
import { TeamMemberRoster } from "@/components/teams/team-member-roster";
import { TeamSettingsPanel } from "@/components/teams/team-settings-panel";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import TeamHeader from "./team-header";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SECURITY_CONFIG } from "@/lib/security-config";
import { safeLog } from "@/lib/security";
import type { Team } from "@/types";
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

interface TeamPageClientProps {
  initialTeam: Team;
  teamId: string;
}

export default function TeamPageClient({
  initialTeam,
  teamId,
}: TeamPageClientProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [team, setTeam] = useState<Team>(initialTeam);
  const { toast } = useToast();
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [isRefreshingElo, setIsRefreshingElo] = useState(false);
  const [userCurrentTeam, setUserCurrentTeam] = useState<Team | null>(null);
  const [memberToRemove, setMemberToRemove] = useState<{ id: string; name: string } | null>(null);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [showCancelJoinRequestDialog, setShowCancelJoinRequestDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const checkUserTeamRef = useRef(false);

  const isTeamCaptain = session?.user?.id === team.captain.discordId;
  const isMember = team.members.some((m) => m.discordId === session?.user?.id);

  const refetchTeam = useCallback(async () => {
    try {
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(teamId);
      const endpoint = isObjectId ? `/api/teams/${teamId}` : `/api/teams/tag/${teamId}`;
      const res = await fetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        setTeam(data);
      }
    } catch (error) {
      safeLog.error("Failed to fetch team:", error);
      toast({
        title: "Error",
        description: "Failed to load team data",
        variant: "destructive",
      });
    }
  }, [teamId, toast]);

  useEffect(() => {
    const check = async () => {
      if (!session?.user?.id || !team) return;
      if (team.members.some((m) => m.discordId === session.user.id)) return;
      try {
        const res = await fetch(
          `/api/teams/${team._id}/join-requests?userId=${session.user.id}`
        );
        if (res.ok) {
          const data = await res.json();
          setHasPendingRequest(data.hasPendingRequest);
        }
      } catch (error) {
        safeLog.error("Failed to check join request status:", error);
      }
    };
    check();
  }, [team, session?.user?.id]);

  useEffect(() => {
    if (checkUserTeamRef.current || !session?.user) return;
    checkUserTeamRef.current = true;
    const check = async () => {
      try {
        const res = await fetch("/api/teams/my-team");
        if (res.ok) {
          const data = await res.json();
          if (data.team) setUserCurrentTeam(data.team);
        } else if (res.status === 429) {
          safeLog.warn("Rate limited on user team check");
        }
      } catch (error) {
        safeLog.error("Error checking user team:", error);
      }
    };
    check();
  }, [session]);

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "Invalid date";
    }
  };

  const handleRefreshElo = async () => {
    if (!team) return;
    try {
      setIsRefreshingElo(true);
      const res = await fetch(`/api/teams/${team._id}/refresh-elo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isAdminRequest:
            session?.user?.id === SECURITY_CONFIG.DEVELOPER_ID ||
            (Array.isArray(session?.user?.roles) && session?.user?.roles.includes("admin")),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to refresh team ELO");
      }
      const data = await res.json();
      setTeam((prev) => ({ ...prev, teamElo: data.teamElo }));
      toast({ title: "Success", description: "Team ELO refreshed successfully" });
    } catch (error: unknown) {
      safeLog.error("Refresh ELO error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to refresh team ELO",
        variant: "destructive",
      });
    } finally {
      setIsRefreshingElo(false);
    }
  };

  const canRefreshElo = () => {
    if (!session?.user?.id) return false;
    if (isTeamCaptain) return true;
    if (session.user.id === SECURITY_CONFIG.DEVELOPER_ID) return true;
    return Array.isArray(session.user.roles) && session.user.roles.includes("admin");
  };

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
      const res = await fetch(`/api/teams/${team._id}/remove-member`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId: memberToRemove.id }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to remove team member");
      }
      toast({
        title: "Success",
        description: `${memberToRemove.name} has been removed from the team`,
        duration: 2000,
      });
      setShowRemoveDialog(false);
      setMemberToRemove(null);
      await refetchTeam();
    } catch (error: unknown) {
      safeLog.error("Error removing member:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to remove team member",
        variant: "destructive",
        duration: 2000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const teamSize = team.teamSize ?? 4;
  const currentActive = team.members.filter(
    (m) => (m.role?.toLowerCase() ?? "") !== "substitute" && m.discordId !== team.captain.discordId
  ).length;
  const canInvite = isTeamCaptain && currentActive < teamSize - 1;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-screen-xl px-4 py-6 sm:px-6 lg:px-8 xl:px-12 sm:py-8 lg:py-10">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 sm:mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/tournaments/teams")}
            className="h-9 gap-2 text-muted-foreground hover:text-foreground sm:h-10"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Teams
          </Button>
          {isMember && (
            <Button
              variant="outline"
              size="sm"
              className="h-9 border-border/50 sm:h-10"
              onClick={() => setShowSettingsDialog(true)}
            >
              <Settings className="mr-2 h-4 w-4" />
              Team settings
            </Button>
          )}

        <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
          <DialogContent
            className="max-h-[90dvh] w-[calc(100vw-1rem)] max-w-lg overflow-y-auto p-4 sm:p-6"
            aria-describedby={undefined}
          >
            <DialogHeader>
              <DialogTitle className="flex gap-2 items-center pr-8">
                <Settings className="h-5 w-5 text-primary" />
                Team settings
              </DialogTitle>
            </DialogHeader>
            <TeamSettingsPanel
              initialTeam={team}
              teamId={teamId}
              onTeamUpdated={(updated) => setTeam(updated)}
            />
          </DialogContent>
        </Dialog>
        </div>

        <TeamHeader
          teamName={team.name}
          teamTag={team.tag}
          teamElo={team.teamElo ?? 0}
          wins={team.wins}
          losses={team.losses}
          onRefreshElo={canRefreshElo() ? handleRefreshElo : undefined}
          isRefreshingElo={isRefreshingElo}
          showRefreshElo={canRefreshElo()}
        />

        {/* Join This Team - non-members */}
        {session?.user?.id && !isMember && (
          <Card className="mb-6 border border-border/50 bg-card/50 shadow-sm sm:mb-8">
            <CardHeader className="pb-3">
              <div className="flex gap-3 items-center">
                <div className="flex justify-center rounded-xl border border-primary/20 bg-primary/10 p-2.5">
                  <UserPlus className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
                </div>
                <CardTitle className="text-lg font-bold text-foreground sm:text-xl">
                  Join This Team
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {team.members.length >= teamSize ? (
                <div className="rounded-lg border-2 border-amber-500/30 bg-amber-500/10 p-4">
                  <div className="flex gap-2 items-center">
                    <AlertCircle className="h-5 w-5 shrink-0 text-amber-500" />
                    <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                      This team is full ({teamSize}/{teamSize} members)
                    </p>
                  </div>
                </div>
              ) : hasPendingRequest ? (
                <div className="space-y-4">
                  <div className="rounded-lg border-2 border-blue-500/30 bg-blue-500/10 p-4">
                    <div className="flex gap-2 items-center">
                      <AlertCircle className="h-5 w-5 shrink-0 text-blue-500" />
                      <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                        You have a pending request to join this team
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="h-10 w-full border-red-500/50 hover:bg-red-500/10 hover:border-red-500 sm:h-11 sm:w-auto"
                    onClick={() => setShowCancelJoinRequestDialog(true)}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <X className="mr-2 h-4 w-4" />
                    )}
                    Cancel Join Request
                  </Button>
                </div>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    This team has {team.members.length}/{teamSize} members. Send a request to join.
                  </p>
                  {userCurrentTeam &&
                  (userCurrentTeam.teamSize ?? 4) === teamSize ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span>
                            <Button disabled className="mt-2 flex cursor-not-allowed gap-2 items-center">
                              <UserPlus className="h-4 w-4" />
                              Request to Join
                            </Button>
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          You are already in a {teamSize}-person team. Leave it to join another.
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    <Button
                      onClick={async () => {
                        setIsSubmitting(true);
                        try {
                          const res = await fetch(`/api/teams/${team._id}/request-join`, {
                            method: "POST",
                          });
                          if (!res.ok) {
                            const data = await res.json();
                            throw new Error(data.error || "Failed to send join request");
                          }
                          setHasPendingRequest(true);
                          toast({
                            title: "Success",
                            description: "Join request sent to team captain",
                            duration: 2000,
                          });
                        } catch (error: unknown) {
                          safeLog.error("Error requesting to join team:", error);
                          toast({
                            title: "Error",
                            description:
                              error instanceof Error ? error.message : "Failed to send join request",
                            variant: "destructive",
                          });
                        } finally {
                          setIsSubmitting(false);
                        }
                      }}
                      disabled={isSubmitting}
                      className="mt-2 h-10 w-full sm:h-11 sm:w-auto"
                    >
                      {isSubmitting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <UserPlus className="mr-2 h-4 w-4" />
                      )}
                      Request to Join
                    </Button>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Two-column layout: left = overview, right = members */}
        <div className="grid gap-6 lg:grid-cols-[1fr,minmax(0,380px)] lg:gap-8">
          {/* Left column: team details (single card) */}
          <section aria-labelledby="overview-heading" className="min-w-0">
            <h2 id="overview-heading" className="mb-4 text-lg font-semibold text-foreground sm:text-xl">
              Team details
            </h2>
            <div className="rounded-xl border border-border/50 bg-card/50 p-5 shadow-sm sm:p-6">
              <dl className="space-y-4">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Team name
                  </dt>
                  <dd className="mt-1 text-lg font-semibold text-foreground">{team.name}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Team tag
                  </dt>
                  <dd className="mt-1">
                    <Badge variant="secondary" className="text-base font-bold border-0">
                      [{team.tag}]
                    </Badge>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Description
                  </dt>
                  <dd className="mt-1 text-sm leading-relaxed text-foreground">
                    {team.description || (
                      <span className="italic text-muted-foreground">No description available</span>
                    )}
                  </dd>
                </div>
                <div className="flex flex-wrap gap-x-6 gap-y-3 border-t border-border/50 pt-4">
                  {team.createdAt && (
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Created
                      </dt>
                      <dd className="mt-1 text-sm font-medium text-foreground">
                        {formatDate(team.createdAt)}
                      </dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Team size
                    </dt>
                    <dd className="mt-1">
                      <Badge variant="secondary" className="text-sm font-bold border-0">
                        {teamSize === 2 ? "2v2" : teamSize === 3 ? "3v3" : teamSize === 4 ? "4v4" : "5v5"} (
                        {teamSize} players)
                      </Badge>
                    </dd>
                  </div>
                </div>
              </dl>
            </div>
          </section>

          {/* Right column: roster (members) */}
          <section aria-labelledby="members-heading" className="min-w-0 overflow-x-hidden">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 id="members-heading" className="text-lg font-semibold text-foreground sm:text-xl">
                Roster
              </h2>
              {canInvite && (
                <Button
                  size="sm"
                  onClick={() => {
                    window.dispatchEvent(
                      new CustomEvent("openInviteModal", { detail: { teamId: team._id } })
                    );
                  }}
                  className="h-9 w-full sm:h-10 sm:w-auto"
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Invite player
                </Button>
              )}
            </div>
            <TeamMemberRoster
              team={team}
              isCaptain={isTeamCaptain}
              onRemoveMember={handleRemoveMemberClick}
            />
          </section>
        </div>

        {/* Full-width: invites (below the two columns) */}
        <section className="mt-8 border-t border-border/40 pt-8" aria-labelledby="recent-invites-heading">
          {isTeamCaptain ? (
            <TeamInvitesList teamId={team._id} isCaptain={true} />
          ) : (
            <div className="rounded-xl border border-border/50 bg-card/50 p-8 text-center">
              <Mail className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">Invites</p>
              <p className="text-xs text-muted-foreground">
                Only the team captain can view and manage invites.
              </p>
            </div>
          )}
        </section>

        {isTeamCaptain && (
          <div
            className="fixed bottom-0 right-0 z-40 p-4 sm:hidden"
            style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom, 0px))" }}
          >
            <Button
              size="lg"
              className="h-14 w-14 rounded-full shadow-lg focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              aria-label="Invite player"
              onClick={() => {
                window.dispatchEvent(
                  new CustomEvent("openInviteModal", { detail: { teamId: team._id } })
                );
              }}
            >
              <UserPlus className="h-6 w-6" />
            </Button>
          </div>
        )}

        <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove team member</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to remove <strong>{memberToRemove?.name}</strong> from the
                team? This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleRemoveMember}
                disabled={isSubmitting}
                className="bg-red-500 hover:bg-red-600"
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <UserMinus className="mr-2 h-4 w-4" />
                )}
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog
          open={showCancelJoinRequestDialog}
          onOpenChange={setShowCancelJoinRequestDialog}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel join request</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to cancel your join request?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isSubmitting}>No</AlertDialogCancel>
              <AlertDialogAction
                onClick={async () => {
                  if (isSubmitting) return;
                  setIsSubmitting(true);
                  try {
                    const res = await fetch(`/api/teams/${team._id}/cancel-join-request`, {
                      method: "POST",
                    });
                    if (!res.ok) {
                      const data = await res.json();
                      throw new Error(data.error || "Failed to cancel join request");
                    }
                    setHasPendingRequest(false);
                    toast({ title: "Success", description: "Join request cancelled", duration: 2000 });
                    router.refresh();
                  } catch (error: unknown) {
                    safeLog.error("Error cancelling join request:", error);
                    toast({
                      title: "Error",
                      description:
                        error instanceof Error ? error.message : "Failed to cancel join request",
                      variant: "destructive",
                    });
                  } finally {
                    setIsSubmitting(false);
                    setShowCancelJoinRequestDialog(false);
                  }
                }}
                disabled={isSubmitting}
              >
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Yes, cancel
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
