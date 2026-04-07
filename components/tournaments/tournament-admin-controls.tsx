"use client";

import {
  Loader2,
  Play,
  RotateCcw,
  Shuffle,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type TournamentAdminControlsProps = {
  tournament: {
    status: string;
    registeredTeams: unknown[];
    maxTeams?: number;
  };
  isSeeded: boolean;
  seeding: boolean;
  unseeding: boolean;
  launching: boolean;
  resetting: boolean;
  isDeveloper: boolean;
  onPreseedOrUndo: () => void;
  onLaunch: () => void;
  onReset: () => void;
  onOpenFillDialog: () => void;
  onOpenClearDialog: () => void;
};

const shellClass =
  "rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 shadow-sm";

export function TournamentAdminControls({
  tournament,
  isSeeded,
  seeding,
  unseeding,
  launching,
  resetting,
  isDeveloper,
  onPreseedOrUndo,
  onLaunch,
  onReset,
  onOpenFillDialog,
  onOpenClearDialog,
}: TournamentAdminControlsProps) {
  const maxTeams = tournament.maxTeams || 8;
  const registered = tournament.registeredTeams.length;
  const fullRoster = registered === maxTeams;
  const isUpcoming = tournament.status === "upcoming";
  const isActive = tournament.status === "active";

  return (
    <Card className={cn(shellClass, "mt-8")}>
      <CardHeader className="border-b border-border/50 pb-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg border border-primary/30 bg-gradient-to-br from-primary/20 to-primary/10 p-2">
            <Shuffle className="h-4 w-4 text-primary" aria-hidden />
          </div>
          <div>
            <CardTitle className="text-base sm:text-lg">Organizer controls</CardTitle>
            <CardDescription className="mt-0.5 text-xs sm:text-sm">
              Seeding, launch, and bracket management for this tournament
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <TooltipProvider delayDuration={300}>
          {isUpcoming ? (
            <div className="space-y-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Setup
              </p>
              <div className="flex flex-wrap gap-2 sm:gap-3">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="secondary"
                      className="gap-2 rounded-full"
                      onClick={onPreseedOrUndo}
                      disabled={
                        (isSeeded ? unseeding : seeding) ||
                        (!isSeeded && registered !== maxTeams)
                      }
                    >
                      {isSeeded ? (
                        unseeding ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                            Removing seeding…
                          </>
                        ) : (
                          <>
                            <RotateCcw className="h-4 w-4" aria-hidden />
                            Undo seeding
                          </>
                        )
                      ) : seeding ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                          Pre-seeding…
                        </>
                      ) : (
                        <>
                          <Shuffle className="h-4 w-4" aria-hidden />
                          Pre-seed teams
                        </>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    {isSeeded ? (
                      <p>Reset the bracket to an unseeded state.</p>
                    ) : registered !== maxTeams ? (
                      <p>
                        Need {maxTeams} teams ({registered}/{maxTeams} registered) before
                        pre-seeding.
                      </p>
                    ) : (
                      <p>Assign seeds from team ELO and prepare the bracket.</p>
                    )}
                  </TooltipContent>
                </Tooltip>

                {fullRoster ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex cursor-default">
                        <Button
                          type="button"
                          className="gap-2 rounded-full"
                          onClick={onLaunch}
                          disabled={launching || !isSeeded}
                        >
                          {launching ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                              Launching…
                            </>
                          ) : (
                            <>
                              <Play className="h-4 w-4" aria-hidden />
                              Launch tournament
                            </>
                          )}
                        </Button>
                      </span>
                    </TooltipTrigger>
                    {!isSeeded ? (
                      <TooltipContent>
                        <p>Pre-seed teams before launch.</p>
                      </TooltipContent>
                    ) : null}
                  </Tooltip>
                ) : null}
              </div>
            </div>
          ) : null}

          {isDeveloper && isUpcoming ? (
            <>
              {isUpcoming ? <Separator className="bg-border/60" /> : null}
              <div className="space-y-3">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Developer testing
                </p>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="gap-2 rounded-full border-border/80"
                        onClick={onOpenFillDialog}
                      >
                        <Users className="h-4 w-4" aria-hidden />
                        Fill tournament
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Fill with random teams (testing only).</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="gap-2 rounded-full border-destructive/40 text-destructive hover:bg-destructive/10"
                        onClick={onOpenClearDialog}
                      >
                        <X className="h-4 w-4" aria-hidden />
                        Clear teams
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Remove all registered teams (testing only).</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </>
          ) : null}

          {isActive ? (
            <>
              <Separator className="bg-border/60" />
              <div className="space-y-3">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Danger zone
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2 rounded-full border-amber-500/40 text-amber-600 hover:bg-amber-500/10 dark:text-amber-400"
                  onClick={onReset}
                  disabled={resetting}
                >
                  {resetting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      Resetting…
                    </>
                  ) : (
                    <>
                      <RotateCcw className="h-4 w-4" aria-hidden />
                      Reset tournament
                    </>
                  )}
                </Button>
              </div>
            </>
          ) : null}
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
