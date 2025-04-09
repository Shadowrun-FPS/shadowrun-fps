import Link from "next/link";
import { format } from "date-fns";
import { Calendar, Clock, Users, ArrowRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
  const teamsCount = tournament.registeredTeams?.length || 0;
  const maxTeams = tournament.maxTeams || 8;
  const teamsProgress = (teamsCount / maxTeams) * 100;

  return (
    <Card className="overflow-hidden transition-all border-l-4 hover:shadow-md border-l-primary/30 hover:border-l-primary">
      <CardHeader className="pb-2">
        <div className="flex justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Badge
                variant={
                  isUpcoming ? "secondary" : isActive ? "default" : "outline"
                }
              >
                {isUpcoming ? "Upcoming" : isActive ? "Active" : "Completed"}
              </Badge>
              <Badge variant="outline" className="font-normal">
                {tournament.format === "single_elimination"
                  ? "Single Elimination"
                  : "Double Elimination"}
              </Badge>
            </div>
            <CardTitle className="mt-2 text-xl">{tournament.name}</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3">
          <div className="flex items-center text-sm">
            <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
            <span>
              {format(startDate, "MMMM d, yyyy")} at{" "}
              {format(startDate, "h:mm a")}
            </span>
          </div>
          <div className="flex items-center text-sm">
            <Users className="w-4 h-4 mr-2 text-muted-foreground" />
            <span>
              {tournament.teamSize}v{tournament.teamSize} • {teamsCount}/
              {maxTeams} Teams
            </span>
          </div>
          {tournament.description && (
            <p className="mt-1 text-sm text-muted-foreground">
              {tournament.description.length > 120
                ? `${tournament.description.substring(0, 120)}...`
                : tournament.description}
            </p>
          )}
        </div>
      </CardContent>
      <div className="h-1 bg-muted">
        <div
          className="h-full bg-primary"
          style={{ width: `${teamsProgress}%` }}
        ></div>
      </div>
      <CardFooter className="flex justify-between p-4 border-t">
        <div className="text-sm text-muted-foreground">
          {isUpcoming && tournament.registrationDeadline && (
            <span className="flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              Registration closes on{" "}
              {format(new Date(tournament.registrationDeadline), "MMM d, yyyy")}
            </span>
          )}
        </div>
        <Button asChild>
          <Link href={`/tournaments/${tournament._id}`}>
            View Details
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
