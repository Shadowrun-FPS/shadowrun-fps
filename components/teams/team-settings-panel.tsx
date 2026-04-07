"use client";

import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Settings,
  Shield,
  LogIn,
  AlertCircle,
  Loader2,
  ChevronDown,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TeamSettingsForm } from "@/components/teams/team-settings-form";
import { useToast } from "@/components/ui/use-toast";
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

interface TeamSettingsPanelProps {
  initialTeam: Team;
  teamId: string;
  onTeamUpdated?: (team: Team) => void;
}

function formatDate(dateString: string | undefined): string {
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
}

export function TeamSettingsPanel({
  initialTeam,
  teamId,
  onTeamUpdated,
}: TeamSettingsPanelProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const { toast } = useToast();
  const [team, setTeam] = useState<Team>(initialTeam);
  const [newCaptainId, setNewCaptainId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const isTeamCaptain = session?.user?.id === team.captain.discordId;
  const isMember = team.members.some((m) => m.discordId === session?.user?.id);
  const otherMembersCount = team.members.filter(
    (m) => m.discordId !== session?.user?.id
  ).length;
  const canDelete = isTeamCaptain && otherMembersCount === 0;

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
        onTeamUpdated?.(data);
      }
    } catch (error) {
      safeLog.error("Failed to refetch team:", error);
    }
  }, [teamId, onTeamUpdated]);

  const handleTransferCaptain = () => {
    if (!newCaptainId) {
      toast({
        title: "Error",
        description: "Please select a team member first",
        variant: "destructive",
      });
      return;
    }
    setShowTransferDialog(true);
  };

  const confirmTransferCaptain = async () => {
    if (!newCaptainId) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/teams/${team._id}/transfer-captain`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newCaptainId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to transfer captain role");
      }
      setShowTransferDialog(false);
      setNewCaptainId("");
      toast({ title: "Success", description: "Captain role transferred successfully" });
      await refetchTeam();
    } catch (error: unknown) {
      safeLog.error("Transfer captain error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to transfer captain role",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLeaveTeam = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/teams/${team._id}/leave`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to leave team");
      }
      toast({ title: "Success", description: "You have left the team", duration: 2000 });
      router.refresh();
      router.push("/tournaments/teams");
    } catch (error: unknown) {
      safeLog.error("Error leaving team:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to leave team",
        variant: "destructive",
        duration: 2000,
      });
    } finally {
      setIsSubmitting(false);
      setShowLeaveDialog(false);
    }
  };

  const handleDeleteTeam = async () => {
    if (!isTeamCaptain || otherMembersCount > 0) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/teams/${team._id}/delete`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete team");
      }
      toast({ title: "Team Deleted", description: "Your team has been permanently deleted" });
      router.push("/tournaments/teams");
    } catch (error: unknown) {
      safeLog.error("Error deleting team:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete team",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setShowDeleteDialog(false);
    }
  };

  if (!isMember) {
    return (
      <div className="rounded-xl border border-border/70 bg-muted/30 p-6 text-center">
        <p className="text-sm font-medium text-foreground">
          You must be a team member to access settings.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section aria-labelledby="edit-team-heading">
        <h2 id="edit-team-heading" className="sr-only">
          Edit team details
        </h2>
        <TeamSettingsForm
          team={team}
          formatDate={formatDate}
          onSuccess={refetchTeam}
        />
      </section>

      <section aria-labelledby="danger-zone-heading">
        <Collapsible defaultOpen={false}>
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex w-full gap-3 items-center rounded-lg border-2 border-red-500/30 bg-red-500/5 py-3 px-4 text-left transition-colors hover:bg-red-500/10"
              id="danger-zone-heading"
            >
              <AlertCircle className="h-5 w-5 shrink-0 text-red-500 sm:h-6 sm:w-6" />
              <span className="text-lg font-semibold text-red-700 dark:text-red-300">
                Danger zone
              </span>
              <ChevronDown className="ml-auto h-5 w-5 shrink-0 text-red-500 transition-transform duration-200 [[data-state=open]_&]:rotate-180" />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-4 space-y-6 rounded-b-xl border-2 border-t-0 border-red-500/30 bg-red-500/5 p-6">
              {isTeamCaptain && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground">Transfer captain role</h3>
                  <p className="text-sm text-muted-foreground">
                    Give another member full control. This cannot be undone by you.
                  </p>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                    <div className="flex-1 space-y-2 min-w-0">
                      <Label htmlFor="newCaptain-modal">New captain</Label>
                      <Select
                        value={newCaptainId}
                        onValueChange={setNewCaptainId}
                        disabled={
                          team.members.filter((m) => m.discordId !== session?.user?.id)
                            .length === 0
                        }
                      >
                        <SelectTrigger id="newCaptain-modal" className="h-10 sm:h-11">
                          <SelectValue
                            placeholder={
                              team.members.filter((m) => m.discordId !== session?.user?.id)
                                .length === 0
                                ? "No other members"
                                : "Choose a member"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {team.members
                            .filter((m) => m.discordId !== session?.user?.id)
                            .map((m) => (
                              <SelectItem key={m.discordId} value={m.discordId}>
                                {m.discordNickname || m.discordUsername}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleTransferCaptain}
                      disabled={
                        !newCaptainId ||
                        isSubmitting ||
                        team.members.filter((m) => m.discordId !== session?.user?.id)
                          .length === 0
                      }
                      className="h-10 shrink-0 border-amber-500/50 text-amber-700 hover:bg-amber-500/10 sm:h-11"
                    >
                      <Shield className="mr-2 h-4 w-4" />
                      Transfer captain
                    </Button>
                  </div>
                </div>
              )}

              {!isTeamCaptain && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground">Leave team</h3>
                  <p className="text-sm text-muted-foreground">
                    You will need an invite to rejoin.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowLeaveDialog(true)}
                    disabled={isSubmitting}
                    className="h-10 border-red-500/50 text-red-600 hover:bg-red-500/10 sm:h-11"
                  >
                    <LogIn className="mr-2 h-4 w-4" />
                    Leave team
                  </Button>
                </div>
              )}

              {isTeamCaptain && (
                <div className="space-y-4 border-t border-red-500/20 pt-6">
                  <h3 className="font-semibold text-foreground">Leave team</h3>
                  <p className="text-sm text-muted-foreground">
                    Transfer the captain role first, or leave and the next member may become captain.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowLeaveDialog(true)}
                    disabled={isSubmitting}
                    className="h-10 border-red-500/50 text-red-600 hover:bg-red-500/10 sm:h-11"
                  >
                    <LogIn className="mr-2 h-4 w-4" />
                    Leave team
                  </Button>
                </div>
              )}

              {canDelete && (
                <div className="space-y-4 border-t border-red-500/20 pt-6">
                  <h3 className="font-semibold text-foreground">Delete team</h3>
                  <p className="text-sm text-muted-foreground">
                    Permanently delete this team. All data will be lost. This cannot be undone.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDeleteDialog(true)}
                    disabled={isSubmitting}
                    className="h-10 border-red-500/50 text-red-600 hover:bg-red-500/10 sm:h-11"
                  >
                    <AlertCircle className="mr-2 h-4 w-4" />
                    Delete team permanently
                  </Button>
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </section>

      <AlertDialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Transfer captain role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to transfer the captain role to{" "}
              <strong>
                {team.members.find((m) => m.discordId === newCaptainId)?.discordNickname ||
                  team.members.find((m) => m.discordId === newCaptainId)?.discordUsername ||
                  "this member"}
              </strong>
              ? You will lose captain privileges. This cannot be undone by you.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmTransferCaptain}
              disabled={isSubmitting}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Shield className="mr-2 h-4 w-4" />
              )}
              Transfer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave team</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to leave this team? You will need to be invited again to rejoin.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLeaveTeam}
              disabled={isSubmitting}
              className="bg-red-500 hover:bg-red-600"
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <LogIn className="mr-2 h-4 w-4" />
              )}
              Leave team
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete team permanently</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete <strong>{team.name}</strong>? All team
              data will be lost. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTeam}
              disabled={isSubmitting}
              className="bg-red-500 hover:bg-red-600"
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <AlertCircle className="mr-2 h-4 w-4" />
              )}
              Delete permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
