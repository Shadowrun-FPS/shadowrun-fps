"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Hash,
  Loader2,
  RefreshCw,
  Settings,
  Shield,
  Users,
  Link2,
  Check,
} from "lucide-react";
import type { Team } from "@/types";

type TeamPageHeroProps = {
  team: Team;
  teamSize: number;
  memberCount: number;
  linkCopied: boolean;
  onCopyLink: () => void;
  isMember: boolean;
  onOpenSettings: () => void;
  onRefreshElo?: () => void;
  isRefreshingElo?: boolean;
  showRefreshElo?: boolean;
};

function formatTeamMode(teamSize: number): string {
  if (teamSize === 2) return "2v2";
  if (teamSize === 3) return "3v3";
  if (teamSize === 4) return "4v4";
  if (teamSize === 5) return "5v5";
  return `${teamSize}v${teamSize}`;
}

export function TeamPageHero({
  team,
  teamSize,
  memberCount,
  linkCopied,
  onCopyLink,
  isMember,
  onOpenSettings,
  onRefreshElo,
  isRefreshingElo = false,
  showRefreshElo = false,
}: TeamPageHeroProps) {
  const winsNum = Number(team.wins ?? 0);
  const lossesNum = Number(team.losses ?? 0);
  const total = winsNum + lossesNum;
  let winPct = 0;
  if (total > 0) {
    winPct = (winsNum / total) * 100;
    if (winsNum === 1 && lossesNum === 0) winPct = 100;
    winPct = Math.round(winPct);
  }
  const winDisplay = total > 0 ? `${winPct}%` : "—";
  const elo = team.teamElo ?? 0;

  const statPills: { key: string; label: string }[] = [
    { key: "elo", label: `${elo.toLocaleString()} ELO` },
    { key: "rec", label: `${winsNum}–${lossesNum} record` },
    { key: "wr", label: `Win rate ${winDisplay}` },
    { key: "mode", label: formatTeamMode(teamSize) },
  ];
  if (team.createdAt) {
    try {
      const d = new Date(team.createdAt);
      statPills.push({
        key: "created",
        label: `Since ${d.toLocaleDateString(undefined, { month: "short", year: "numeric" })}`,
      });
    } catch {
      /* skip */
    }
  }

  return (
    <div className="mb-8 grid gap-8 lg:mb-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start lg:gap-10">
      {/* Left: feature panel */}
      <div className="relative min-h-[220px] overflow-hidden rounded-3xl border-2 border-primary/20 bg-gradient-to-br from-primary/20 via-card to-card shadow-sm sm:min-h-[280px]">
        <Shield
          className="pointer-events-none absolute -right-8 -top-8 h-64 w-64 text-primary/[0.12] sm:h-80 sm:w-80"
          aria-hidden
        />
        <div className="relative flex h-full min-h-[inherit] flex-col justify-end p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            About
          </p>
          <p className="mt-2 line-clamp-4 text-sm leading-relaxed text-foreground/90 sm:text-base">
            {team.description?.trim() ||
              "Competitive Shadowrun FPS team. Check stats and upcoming events for schedules."}
          </p>
        </div>
      </div>

      {/* Right: identity + share + stats */}
      <div className="flex min-w-0 flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-[2.5rem] lg:leading-tight">
            {team.name}
          </h1>
          <div className="mt-3 flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6 sm:gap-y-1">
            <span className="inline-flex items-center gap-2">
              <Hash className="h-4 w-4 shrink-0 text-primary/80" aria-hidden />
              <span className="text-foreground/80">[{team.tag}]</span>
            </span>
            <span className="inline-flex items-center gap-2">
              <Users className="h-4 w-4 shrink-0 text-primary/80" aria-hidden />
              <span>
                {memberCount} {memberCount === 1 ? "member" : "members"}
              </span>
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {(isMember || (showRefreshElo && onRefreshElo)) && (
            <div className="flex flex-wrap gap-2">
              {isMember ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-full border-border/80"
                  onClick={onOpenSettings}
                >
                  <Settings className="mr-2 h-4 w-4" aria-hidden />
                  Settings
                </Button>
              ) : null}
              {showRefreshElo && onRefreshElo ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-full border-primary/30"
                  onClick={onRefreshElo}
                  disabled={isRefreshingElo}
                  aria-label="Refresh team ELO"
                >
                  {isRefreshingElo ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" aria-hidden />
                  )}
                  Refresh ELO
                </Button>
              ) : null}
            </div>
          )}
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Share
            </p>
            <div className="mt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full border-border/80"
                onClick={onCopyLink}
              >
                {linkCopied ? (
                  <Check className="mr-2 h-4 w-4 text-primary" aria-hidden />
                ) : (
                  <Link2 className="mr-2 h-4 w-4" aria-hidden />
                )}
                {linkCopied ? "Copied" : "Copy link"}
              </Button>
            </div>
          </div>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Team stats
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {statPills.map((p) => (
              <Badge
                key={p.key}
                variant="outline"
                className="rounded-full border-border/70 bg-background/60 px-3 py-1 text-xs font-medium text-foreground sm:text-sm"
              >
                {p.label}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
