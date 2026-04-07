"use client";

import { format } from "date-fns";
import {
  Calendar,
  ChevronLeft,
  Trophy,
  Users,
  UserCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type TournamentHeroModel = {
  name: string;
  description?: string;
  startDate: string;
  format: "single_elimination" | "double_elimination";
  teamSize: number;
  status: "upcoming" | "active" | "completed";
  coHosts?: string[];
  registrationDeadline?: string;
  registeredTeamsCount: number;
  maxTeams: number;
};

type TournamentDetailHeroProps = {
  tournament: TournamentHeroModel;
  onBack: () => void;
  showEdit: boolean;
  onEditClick: () => void;
};

const shellClass =
  "rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 shadow-sm";

export function TournamentDetailHero({
  tournament,
  onBack,
  showEdit,
  onEditClick,
}: TournamentDetailHeroProps) {
  const max = tournament.maxTeams || 8;
  const pct = Math.min(100, (tournament.registeredTeamsCount / max) * 100);

  return (
    <header className="mb-6 space-y-6 sm:mb-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="-ml-2 h-9 gap-1"
              onClick={onBack}
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
              <span className="text-sm">Back to overview</span>
            </Button>
            {showEdit ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 rounded-full border-border/80"
                onClick={onEditClick}
              >
                Edit tournament
              </Button>
            ) : null}
          </div>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                {tournament.name}
              </h1>
              <Badge
                variant="secondary"
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium",
                  tournament.status === "upcoming" &&
                    "border-blue-500/30 bg-blue-500/20 text-blue-400",
                  tournament.status === "active" &&
                    "border-emerald-500/30 bg-emerald-500/15 text-emerald-400",
                  tournament.status === "completed" &&
                    "border-border/60 bg-muted text-muted-foreground",
                )}
              >
                {tournament.status === "upcoming"
                  ? "Upcoming"
                  : tournament.status === "active"
                    ? "Active"
                    : "Completed"}
              </Badge>
            </div>
            {tournament.description ? (
              <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                {tournament.description}
              </p>
            ) : null}
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
                {format(new Date(tournament.startDate), "MMM d, yyyy")}
              </span>
              <span className="text-border" aria-hidden>
                ·
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Trophy className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
                {tournament.format === "single_elimination"
                  ? "Single elimination"
                  : "Double elimination"}
              </span>
              <span className="text-border" aria-hidden>
                ·
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
                {tournament.teamSize}v{tournament.teamSize}
              </span>
            </p>
          </div>
        </div>
      </div>

      {tournament.coHosts && tournament.coHosts.length > 0 ? (
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem
            value="cohosts"
            className={cn(
              shellClass,
              "mb-0 overflow-hidden border-2 !border-primary/20 shadow-sm",
            )}
          >
            <AccordionTrigger className="px-4 py-3 hover:no-underline sm:px-5 [&[data-state=open]]:border-b [&[data-state=open]]:border-border/50">
              <span className="flex items-center gap-2 text-left text-sm font-medium text-foreground">
                <UserCircle className="h-4 w-4 text-primary" aria-hidden />
                Co-hosts ({tournament.coHosts.length}) — roles & permissions
              </span>
            </AccordionTrigger>
            <AccordionContent className="!pb-4 !pt-0">
              <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
                Co-hosts can help manage this tournament: edit details, pre-seed
                teams, launch the bracket, and manage team registrations.
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      ) : null}

      <Card className={shellClass}>
        <CardContent className="space-y-4 p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" aria-hidden />
              <span className="text-sm font-medium text-foreground">
                Registration
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span>
                {tournament.registeredTeamsCount}/{max} teams
              </span>
              {tournament.registrationDeadline ? (
                <span className="inline-flex items-center gap-1.5">
                  <span className="text-border">·</span>
                  Deadline{" "}
                  {format(new Date(tournament.registrationDeadline), "MMM d, yyyy")}
                </span>
              ) : null}
            </div>
          </div>
          <Progress value={pct} className="h-2" />
        </CardContent>
      </Card>
    </header>
  );
}
