"use client";

import Link from "next/link";
import { format } from "date-fns";
import { Trophy } from "lucide-react";
import { TournamentMemberAvatar } from "@/components/tournaments/tournament-member-avatar";
import { cn } from "@/lib/utils";

export type WinnerBannerMember = {
  discordId: string;
  discordUsername?: string;
  discordNickname?: string | null;
  discordProfilePicture?: string | null;
};

export type WinnerBannerTeam = {
  name: string;
  tag?: string;
  members?: WinnerBannerMember[];
};

type TournamentWinnerBannerProps = {
  winner: WinnerBannerTeam;
  completedAt?: string;
};

const panelClass =
  "overflow-hidden rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 shadow-sm";

export function TournamentWinnerBanner({
  winner,
  completedAt,
}: TournamentWinnerBannerProps) {
  return (
    <section
      aria-label="Tournament champion"
      className={cn(panelClass, "mt-8")}
    >
      <div className="relative px-5 py-8 sm:px-8 sm:py-10">
        <Trophy
          className="pointer-events-none absolute -right-6 -top-6 h-32 w-32 text-primary/[0.08] sm:h-40 sm:w-40"
          aria-hidden
        />
        <div className="relative flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/30 bg-primary/15 sm:h-16 sm:w-16">
            <Trophy className="h-7 w-7 text-primary sm:h-8 sm:w-8" aria-hidden />
          </div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Champion
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {winner.name}
          </h2>
          {winner.tag ? (
            <p className="mt-2 text-sm font-medium text-muted-foreground">
              [{winner.tag}]
            </p>
          ) : null}

          {winner.members && winner.members.length > 0 ? (
            <div className="mt-8 w-full max-w-2xl border-t border-border/50 pt-6">
              <p className="mb-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Roster
              </p>
              <div className="mx-auto grid max-w-lg grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
                {winner.members.map((member) => (
                  <Link
                    key={member.discordId}
                    href={`/player/stats?playerName=${member.discordUsername?.toLowerCase() ?? ""}`}
                    className="flex flex-col items-center rounded-xl border border-transparent p-2 transition-colors hover:border-border/60 hover:bg-muted/30"
                  >
                    <TournamentMemberAvatar
                      profilePicture={member.discordProfilePicture}
                      username={member.discordUsername}
                      size={14}
                    />
                    <span className="mt-2 line-clamp-2 w-full break-words text-center text-sm font-medium text-foreground">
                      {member.discordNickname || member.discordUsername}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}

          <p className="mt-6 text-xs text-muted-foreground sm:text-sm">
            {completedAt
              ? `Completed ${format(new Date(completedAt), "MMMM d, yyyy")}`
              : null}
          </p>
        </div>
      </div>
    </section>
  );
}
