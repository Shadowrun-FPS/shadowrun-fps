"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import {
  Settings,
  Loader2,
  X,
  ArrowLeft,
  UserPlus,
  AlertCircle,
  Mail,
  UserMinus,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { TeamInvitesList } from "@/components/teams/team-invites-list";
import { TeamMemberRoster } from "@/components/teams/team-member-roster";
import { TeamSettingsPanel } from "@/components/teams/team-settings-panel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { TeamPageHero } from "@/components/teams/team-page-hero";
import { TeamUpcomingEvents } from "@/components/teams/team-upcoming-events";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SECURITY_CONFIG } from "@/lib/security-config";
import { safeLog } from "@/lib/security";
import { cn } from "@/lib/utils";
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

const slugPanelClass =
  "rounded-xl border-2 border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 shadow-sm";

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
  const [memberToRemove, setMemberToRemove] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [showCancelJoinRequestDialog, setShowCancelJoinRequestDialog] =
    useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const checkUserTeamRef = useRef(false);
  const linkCopiedResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isTeamCaptain = session?.user?.id === team.captain.discordId;
  const isMember = team.members.some((m) => m.discordId === session?.user?.id);

  const refetchTeam = useCallback(async () => {
    try {
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(teamId);
      const endpoint = isObjectId
        ? `/api/teams/${teamId}`
        : `/api/teams/tag/${teamId}`;
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
          `/api/teams/${team._id}/join-requests?userId=${session.user.id}`,
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
            (Array.isArray(session?.user?.roles) &&
              session?.user?.roles.includes("admin")),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to refresh team ELO");
      }
      const data = await res.json();
      setTeam((prev) => ({ ...prev, teamElo: data.teamElo }));
      toast({
        title: "Success",
        description: "Team ELO refreshed successfully",
      });
    } catch (error: unknown) {
      safeLog.error("Refresh ELO error:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to refresh team ELO",
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
    return (
      Array.isArray(session.user.roles) && session.user.roles.includes("admin")
    );
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
        description:
          error instanceof Error
            ? error.message
            : "Failed to remove team member",
        variant: "destructive",
        duration: 2000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const teamSize = team.teamSize ?? 4;
  const memberCount = useMemo(
    () =>
      team.members.filter((m) => (m.role?.toLowerCase() ?? "") !== "substitute")
        .length,
    [team.members],
  );
  const currentActive = team.members.filter(
    (m) =>
      (m.role?.toLowerCase() ?? "") !== "substitute" &&
      m.discordId !== team.captain.discordId,
  ).length;
  const canInvite = isTeamCaptain && currentActive < teamSize - 1;

  const copyTeamLink = useCallback(() => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (!url) return;
    void navigator.clipboard.writeText(url).then(() => {
      setLinkCopied(true);
      if (linkCopiedResetRef.current) clearTimeout(linkCopiedResetRef.current);
      linkCopiedResetRef.current = setTimeout(() => setLinkCopied(false), 2000);
      toast({
        title: "Link copied",
        description: "Team page URL is on your clipboard.",
      });
    });
  }, [toast]);

  useEffect(() => {
    return () => {
      if (linkCopiedResetRef.current) clearTimeout(linkCopiedResetRef.current);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-screen-xl px-4 py-6 sm:px-6 lg:px-8 xl:px-12 sm:py-8 lg:py-10">
        <nav
          className="mb-4 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground sm:text-sm"
          aria-label="Breadcrumb"
        >
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link
                href="/tournaments"
                className="transition-colors hover:text-foreground"
              >
                Tournaments
              </Link>
            </li>
            <li aria-hidden className="text-border">
              <ChevronRight className="h-3.5 w-3.5" />
            </li>
            <li>
              <Link
                href="/tournaments/teams"
                className="transition-colors hover:text-foreground"
              >
                Teams
              </Link>
            </li>
            <li aria-hidden className="text-border">
              <ChevronRight className="h-3.5 w-3.5" />
            </li>
            <li
              className="max-w-[min(12rem,40vw)] truncate font-medium text-foreground"
              aria-current="page"
            >
              [{team.tag}]
            </li>
          </ol>
        </nav>

        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/tournaments/teams")}
            className="h-9 gap-2 text-muted-foreground hover:text-foreground sm:h-10"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back to Teams
          </Button>
        </div>

        <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
          <DialogContent className="max-h-[90dvh] w-[calc(100vw-1rem)] max-w-lg overflow-y-auto p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 pr-8">
                <Settings
                  className="h-5 w-5 shrink-0 text-primary"
                  aria-hidden
                />
                Team settings
              </DialogTitle>
              <DialogDescription>
                Captains can update the team profile, roster rules, and
                danger-zone actions. Members only see read-only details here
                when applicable.
              </DialogDescription>
            </DialogHeader>
            <TeamSettingsPanel
              initialTeam={team}
              teamId={teamId}
              onTeamUpdated={(updated) => setTeam(updated)}
            />
          </DialogContent>
        </Dialog>

        <TeamPageHero
          team={team}
          teamSize={teamSize}
          memberCount={memberCount}
          linkCopied={linkCopied}
          onCopyLink={copyTeamLink}
          isMember={isMember}
          onOpenSettings={() => setShowSettingsDialog(true)}
          onRefreshElo={canRefreshElo() ? handleRefreshElo : undefined}
          isRefreshingElo={isRefreshingElo}
          showRefreshElo={canRefreshElo()}
        />

        {/* Join This Team - non-members */}
        {session?.user?.id && !isMember && (
          <Card className={cn("mb-6 sm:mb-8", slugPanelClass)}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="flex justify-center rounded-xl border border-primary/30 bg-primary/10 p-2.5">
                  <UserPlus
                    className="h-5 w-5 text-primary sm:h-6 sm:w-6"
                    aria-hidden
                  />
                </div>
                <CardTitle className="text-lg font-bold text-foreground sm:text-xl">
                  Join this team
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {team.members.length >= teamSize ? (
                <div
                  className="flex items-start gap-3 rounded-lg border border-border/70 bg-muted/30 p-4"
                  role="status"
                >
                  <AlertCircle
                    className="mt-0.5 h-5 w-5 shrink-0 text-primary"
                    aria-hidden
                  />
                  <p className="text-sm leading-relaxed text-foreground">
                    This team is full ({teamSize}/{teamSize} members). Check
                    back later or browse other rosters.
                  </p>
                </div>
              ) : hasPendingRequest ? (
                <div className="space-y-4">
                  <div
                    className="flex items-start gap-3 rounded-lg border border-primary/25 bg-primary/5 p-4"
                    role="status"
                  >
                    <Mail
                      className="mt-0.5 h-5 w-5 shrink-0 text-primary"
                      aria-hidden
                    />
                    <p className="text-sm leading-relaxed text-foreground">
                      Your join request is pending. The captain will accept or
                      decline when they can.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    className="h-10 w-full border-destructive/40 text-destructive hover:bg-destructive/10 sm:h-11 sm:w-auto"
                    onClick={() => setShowCancelJoinRequestDialog(true)}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2
                        className="mr-2 h-4 w-4 animate-spin"
                        aria-hidden
                      />
                    ) : (
                      <X className="mr-2 h-4 w-4" aria-hidden />
                    )}
                    Cancel join request
                  </Button>
                </div>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    This team has {team.members.length}/{teamSize} members. Send
                    a request to join.
                  </p>
                  {userCurrentTeam &&
                  (userCurrentTeam.teamSize ?? 4) === teamSize ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span>
                            <Button
                              disabled
                              className="mt-2 flex cursor-not-allowed gap-2 items-center"
                            >
                              <UserPlus className="h-4 w-4" />
                              Request to Join
                            </Button>
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          You are already in a {teamSize}-person team. Leave it
                          to join another.
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    <Button
                      onClick={async () => {
                        setIsSubmitting(true);
                        try {
                          const res = await fetch(
                            `/api/teams/${team._id}/request-join`,
                            {
                              method: "POST",
                            },
                          );
                          if (!res.ok) {
                            const data = await res.json();
                            throw new Error(
                              data.error || "Failed to send join request",
                            );
                          }
                          setHasPendingRequest(true);
                          toast({
                            title: "Success",
                            description: "Join request sent to team captain",
                            duration: 2000,
                          });
                        } catch (error: unknown) {
                          safeLog.error(
                            "Error requesting to join team:",
                            error,
                          );
                          toast({
                            title: "Error",
                            description:
                              error instanceof Error
                                ? error.message
                                : "Failed to send join request",
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

        {/* Two-column layout: left = upcoming events, right = roster */}
        <div className="grid gap-6 lg:grid-cols-[1fr,minmax(0,380px)] lg:gap-8">
          <TeamUpcomingEvents
            teamId={team._id}
            panelClassName={cn(slugPanelClass, "overflow-hidden")}
          />

          {/* Right column: roster (members) */}
          <section
            aria-labelledby="members-heading"
            className="flex min-h-[280px] min-w-0 flex-col overflow-x-hidden lg:min-h-[420px]"
          >
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2
                id="members-heading"
                className="text-base font-semibold tracking-tight text-foreground sm:text-lg"
              >
                Roster
              </h2>
              {canInvite && (
                <Button
                  size="sm"
                  onClick={() => {
                    window.dispatchEvent(
                      new CustomEvent("openInviteModal", {
                        detail: { teamId: team._id },
                      }),
                    );
                  }}
                  className="h-9 w-full sm:h-10 sm:w-auto"
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Invite player
                </Button>
              )}
            </div>
            <div className="flex min-h-0 flex-1 flex-col">
              <TeamMemberRoster
                team={team}
                isCaptain={isTeamCaptain}
                onRemoveMember={handleRemoveMemberClick}
              />
            </div>
          </section>
        </div>

        {/* Full-width: invites (below the two columns) */}
        <section
          className="mt-8 border-t border-border/40 pt-8"
          aria-labelledby="recent-invites-heading"
        >
          {isTeamCaptain ? (
            <TeamInvitesList teamId={team._id} isCaptain={true} />
          ) : (
            <div className={cn("p-8 text-center", slugPanelClass)}>
              <Mail
                className="mx-auto mb-3 h-10 w-10 text-primary/70"
                aria-hidden
              />
              <p className="text-sm font-medium text-foreground">Invites</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Only the team captain can view and manage invites.
              </p>
            </div>
          )}
        </section>

        {isTeamCaptain && (
          <div
            className="fixed bottom-0 right-0 z-40 p-4 sm:hidden"
            style={{
              paddingBottom: "max(1rem, env(safe-area-inset-bottom, 0px))",
            }}
          >
            <Button
              size="lg"
              className="h-14 w-14 rounded-full shadow-lg focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              aria-label="Invite player"
              onClick={() => {
                window.dispatchEvent(
                  new CustomEvent("openInviteModal", {
                    detail: { teamId: team._id },
                  }),
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
                Are you sure you want to remove{" "}
                <strong>{memberToRemove?.name}</strong> from the team? This
                cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isSubmitting}>
                Cancel
              </AlertDialogCancel>
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
                    const res = await fetch(
                      `/api/teams/${team._id}/cancel-join-request`,
                      {
                        method: "POST",
                      },
                    );
                    if (!res.ok) {
                      const data = await res.json();
                      throw new Error(
                        data.error || "Failed to cancel join request",
                      );
                    }
                    setHasPendingRequest(false);
                    toast({
                      title: "Success",
                      description: "Join request cancelled",
                      duration: 2000,
                    });
                    router.refresh();
                  } catch (error: unknown) {
                    safeLog.error("Error cancelling join request:", error);
                    toast({
                      title: "Error",
                      description:
                        error instanceof Error
                          ? error.message
                          : "Failed to cancel join request",
                      variant: "destructive",
                    });
                  } finally {
                    setIsSubmitting(false);
                    setShowCancelJoinRequestDialog(false);
                  }
                }}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Yes, cancel
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
