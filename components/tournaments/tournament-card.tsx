import Link from "next/link";
import { format } from "date-fns";
import { Calendar, Users, ArrowRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Tournament {
  _id: string;
  name: string;
  description?: string;
  startDate: string;
  teamSize: number;
  format: "single_elimination" | "double_elimination";
  status: "upcoming" | "active" | "completed";
  registrationDeadline?: string;
  registeredTeams: { _id: string; name: string; tag: string }[];
  maxTeams?: number;
}

interface TournamentCardProps {
  tournament: Tournament;
}

export function TournamentCard({ tournament }: TournamentCardProps) {
  const startDate = new Date(tournament.startDate);
  const isUpcoming = tournament.status === "upcoming";
  const isActive = tournament.status === "active";
  const isCompleted = tournament.status === "completed";
  const teamsCount = tournament.registeredTeams?.length || 0;
  const maxTeams = tournament.maxTeams || 8;
  const teamsProgress = (teamsCount / maxTeams) * 100;

  return (
    <Card
      className={cn(
        "group flex h-full flex-col overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 shadow-sm transition-[border-color,box-shadow] duration-200 ease-out motion-reduce:transition-none",
        "hover:border-primary/40 hover:shadow-xl",
      )}
    >
      <CardHeader className="pb-3 space-y-3 h-[8.75rem]">
        {/* Badges */}
        <div className="flex items-center gap-2 flex-wrap h-[1.75rem]">
          <Badge
            variant="secondary"
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium",
              isUpcoming && "bg-blue-500/20 text-blue-400 border-blue-500/30",
              isActive && "bg-green-500/20 text-green-400 border-green-500/30",
              isCompleted && "bg-muted text-muted-foreground",
            )}
          >
            {isUpcoming ? "Upcoming" : isActive ? "Active" : "Completed"}
          </Badge>
          <Badge
            variant="outline"
            className="rounded-full px-3 py-1 text-xs font-medium border-primary/30 bg-primary/10 text-primary"
          >
            {tournament.teamSize}v{tournament.teamSize}
          </Badge>
          <Badge
            variant="outline"
            className="rounded-full px-3 py-1 text-xs font-normal border-muted-foreground/30 bg-muted/30"
          >
            {tournament.format === "single_elimination"
              ? "Single Elimination"
              : "Double Elimination"}
          </Badge>
        </div>

        {/* Title */}
        <CardTitle className="text-xl sm:text-2xl font-bold leading-tight group-hover:text-primary transition-colors line-clamp-2 min-h-[3.5rem]">
          {tournament.name}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Date & Time */}
        <div className="flex items-center gap-2 text-sm">
          <div className="p-1.5 rounded-md bg-primary/10 border border-primary/20">
            <Calendar className="w-4 h-4 text-primary" />
          </div>
          <span className="text-foreground">
            {format(startDate, "MMMM d, yyyy")} at {format(startDate, "h:mm a")}
          </span>
        </div>

        {/* Team Size & Registration */}
        <div className="flex items-center gap-2 text-sm">
          <div className="p-1.5 rounded-md bg-primary/10 border border-primary/20">
            <Users className="w-4 h-4 text-primary" />
          </div>
          <span className="text-foreground">
            {tournament.teamSize}v{tournament.teamSize} • {teamsCount}/
            {maxTeams} Teams
          </span>
        </div>

        {/* Description */}
        <div className="min-h-[2.5rem]">
          {tournament.description && (
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
              {tournament.description}
            </p>
          )}
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Registration Progress</span>
            <span className="font-medium text-foreground">
              {teamsCount}/{maxTeams}
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(teamsProgress, 100)}%` }}
            />
          </div>
        </div>
      </CardContent>

      <CardFooter className="mt-auto flex min-h-[4.5rem] items-center border-t border-border/50 pt-4">
        <Button
          asChild
          variant="outline"
          className="group/button w-full rounded-full border-border/80"
        >
          <Link
            href={`/tournaments/${tournament._id}`}
            className="flex items-center justify-center gap-2"
          >
            View details
            <ArrowRight className="h-4 w-4 transition-transform group-hover/button:translate-x-0.5" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
