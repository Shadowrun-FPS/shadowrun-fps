"use client";

import Image from "next/image";
import { Users, UserMinus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Team, TeamMember } from "@/types";
import { cn } from "@/lib/utils";

function formatDate(dateString: string | undefined): string {
  if (!dateString) return "—";
  try {
    return new Date(dateString).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

function formatElo(elo: number | Record<string, number> | undefined): string {
  if (elo === undefined || elo === null) return "—";
  const value =
    typeof elo === "object" ? (elo["4v4"] ?? Object.values(elo)[0]) : elo;
  if (value === undefined || value === null) return "—";
  return Number(value).toLocaleString();
}

interface TeamMemberRosterProps {
  team: Team;
  isCaptain: boolean;
  onRemoveMember: (memberId: string, memberName: string) => void;
}

export function TeamMemberRoster({
  team,
  isCaptain,
  onRemoveMember,
}: TeamMemberRosterProps) {
  // Captain joinedAt (and elo) may live on the member record; merge for display
  const captainMember = team.members.find(
    (m) =>
      m.discordId === team.captain.discordId ||
      (m.role?.toLowerCase() ?? "") === "captain",
  );
  const captain: TeamMember = {
    ...team.captain,
    joinedAt: captainMember?.joinedAt ?? team.captain.joinedAt,
    elo: captainMember?.elo ?? team.captain.elo,
  };
  const activeMembers = team.members.filter(
    (m) =>
      (m.role?.toLowerCase() ?? "") !== "substitute" &&
      m.discordId !== captain.discordId,
  );
  const substitutes = team.members.filter(
    (m) => (m.role?.toLowerCase() ?? "") === "substitute",
  );
  const rosterPanel =
    "rounded-xl border-2 border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 shadow-sm";

  return (
    <TooltipProvider delayDuration={300}>
      <div className="space-y-6">
        {/* Card layout at all breakpoints so roster fits narrow right column without scroll */}
        <div className="space-y-3">
          <div className={cn(rosterPanel, "p-4")}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-primary/20 bg-primary/10">
                  {captain.discordProfilePicture ? (
                    <Image
                      src={captain.discordProfilePicture}
                      alt={
                        captain.discordNickname || captain.discordUsername || ""
                      }
                      width={48}
                      height={48}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Users className="h-6 w-6 text-primary" aria-hidden />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold">
                    {captain.discordNickname ||
                      captain.discordUsername ||
                      "Captain"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <span className="block sm:inline">
                      Joined {formatDate(captain.joinedAt)}
                    </span>
                    <span className="hidden sm:inline" aria-hidden>
                      {" "}
                      ·{" "}
                    </span>
                    <span className="mt-0.5 block whitespace-nowrap sm:mt-0 sm:inline">
                      ELO {formatElo(captain.elo)}
                    </span>
                  </p>
                </div>
              </div>
              <Badge
                variant="secondary"
                className="shrink-0 border-primary/20 font-semibold"
              >
                Captain
              </Badge>
            </div>
          </div>
          {activeMembers.map((member) => (
            <div
              key={member.discordId}
              className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-background/40 p-4"
            >
              <div className="flex gap-3 items-center min-w-0">
                <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-muted/50">
                  {member.discordProfilePicture ? (
                    <Image
                      src={member.discordProfilePicture}
                      alt={
                        member.discordNickname || member.discordUsername || ""
                      }
                      width={44}
                      height={44}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Users className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {member.discordNickname || member.discordUsername || "—"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <span className="block sm:inline">
                      Joined {formatDate(member.joinedAt)}
                    </span>
                    <span className="hidden sm:inline" aria-hidden>
                      {" "}
                      ·{" "}
                    </span>
                    <span className="mt-0.5 block whitespace-nowrap sm:mt-0 sm:inline">
                      ELO {formatElo(member.elo)}
                    </span>
                  </p>
                </div>
              </div>
              {isCaptain && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-muted-foreground hover:bg-red-500/10 hover:text-red-600"
                      onClick={() =>
                        onRemoveMember(
                          member.discordId,
                          member.discordNickname ||
                            member.discordUsername ||
                            "member",
                        )
                      }
                      aria-label={`Remove ${member.discordNickname || member.discordUsername || "member"} from team`}
                    >
                      <UserMinus className="h-4 w-4" aria-hidden />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="max-w-[220px]">
                    <p>
                      Remove{" "}
                      <span className="font-medium">
                        {member.discordNickname ||
                          member.discordUsername ||
                          "this player"}
                      </span>{" "}
                      from the roster.
                    </p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          ))}
          {substitutes.map((member) => (
            <div
              key={member.discordId}
              className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-background/40 p-4"
            >
              <div className="flex gap-3 items-center min-w-0">
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-muted/50">
                  {member.discordProfilePicture ? (
                    <Image
                      src={member.discordProfilePicture}
                      alt={
                        member.discordNickname || member.discordUsername || ""
                      }
                      width={40}
                      height={40}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Users className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {member.discordNickname || member.discordUsername || "—"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Substitute · Joined {formatDate(member.joinedAt)}
                  </p>
                </div>
              </div>
              {isCaptain && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-muted-foreground hover:bg-red-500/10 hover:text-red-600"
                      onClick={() =>
                        onRemoveMember(
                          member.discordId,
                          member.discordNickname ||
                            member.discordUsername ||
                            "substitute",
                        )
                      }
                      aria-label={`Remove ${member.discordNickname || member.discordUsername || "substitute"} from team`}
                    >
                      <UserMinus className="h-4 w-4" aria-hidden />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="max-w-[220px]">
                    <p>
                      Remove substitute{" "}
                      <span className="font-medium">
                        {member.discordNickname ||
                          member.discordUsername ||
                          "this player"}
                      </span>{" "}
                      from the roster.
                    </p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          ))}
        </div>

        {activeMembers.length === 0 && substitutes.length === 0 && (
          <div className={cn(rosterPanel, "p-8 text-center")}>
            <p className="text-sm font-medium text-foreground">
              No other members yet
            </p>
            <p className="text-xs text-muted-foreground">
              {isCaptain
                ? "Invite players to fill the roster."
                : "This team is looking for members."}
            </p>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
