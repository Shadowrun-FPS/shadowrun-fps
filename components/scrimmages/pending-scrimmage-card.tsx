import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { toast } from "@/components/ui/use-toast";
import { CancelConfirmationDialog } from "./cancel-confirmation-dialog";
import Link from "next/link";

interface PendingScrimmageCardProps {
  scrimmage: any;
  isTeamCaptain: boolean;
  userTeam: any;
  onAccept?: (scrimmageId: string) => void;
  onReject?: (scrimmageId: string) => void;
  onCancel?: (scrimmageId: string) => void;
}

export function PendingScrimmageCard({
  scrimmage,
  isTeamCaptain,
  userTeam,
  onAccept,
  onReject,
  onCancel,
}: PendingScrimmageCardProps) {
  // Determine if the user's team is the challenger or challenged
  const isChallenger = userTeam?._id === scrimmage.challengerTeam?._id;
  const isChallenged = userTeam?._id === scrimmage.challengedTeam?._id;

  // Format the date
  const formattedDate = scrimmage.proposedDate
    ? format(new Date(scrimmage.proposedDate), "PPP 'at' p")
    : "Date not specified";

  return (
    <Card className="overflow-hidden transition-all hover:shadow-lg hover:shadow-primary/5 hover:border-primary/30 border-2">
      <CardHeader className="p-3 sm:p-4 pb-2 sm:pb-3 bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-b">
        <div className="flex flex-col gap-2">
          {/* Status badge - top right on small screens, normal position on larger screens */}
          <div className="flex justify-end sm:hidden">
            <Badge className="bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/50 shrink-0">
              Pending
            </Badge>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base sm:text-lg font-bold mb-1.5 sm:mb-2 break-words">
                <span className="block sm:inline">{scrimmage.challengerTeam?.name || "Team A"}</span>
                <span className="mx-1.5 sm:mx-2 text-muted-foreground">vs</span>
                <span className="block sm:inline">{scrimmage.challengedTeam?.name || "Team B"}</span>
              </CardTitle>
              <div className="flex flex-wrap gap-1.5 sm:gap-2 items-center mt-1.5">
                {scrimmage.teamSize && (
                  <Badge variant="secondary" className="text-xs">
                    {scrimmage.teamSize === 2
                      ? "2v2"
                      : scrimmage.teamSize === 3
                      ? "3v3"
                      : scrimmage.teamSize === 4
                      ? "4v4"
                      : scrimmage.teamSize === 5
                      ? "5v5"
                      : `${scrimmage.teamSize}v${scrimmage.teamSize}`}
                  </Badge>
                )}
              </div>
            </div>
            <Badge className="hidden sm:flex bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/50 shrink-0">
              Pending
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 pt-2 sm:pt-3 pb-2 sm:pb-3">
        <div className="space-y-2 sm:space-y-3">
          <div className="flex items-center gap-2 text-xs sm:text-sm">
            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground break-words">
              {format(new Date(scrimmage.proposedDate), "MMMM d, yyyy")}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs sm:text-sm">
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground">
              {format(new Date(scrimmage.proposedDate), "h:mm a")}
            </span>
          </div>

          {scrimmage.selectedMaps && scrimmage.selectedMaps.length > 0 && (
            <div className="flex items-start gap-2 text-xs sm:text-sm pt-1">
              <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="font-medium mb-1 sm:mb-1.5 text-foreground">Maps</p>
                <div className="flex flex-wrap gap-1 sm:gap-1.5">
                  {scrimmage.selectedMaps.slice(0, 3).map((map: any, idx: number) => (
                    <Badge
                      key={map.id || idx}
                      variant="secondary"
                      className="text-xs font-normal break-words max-w-full"
                    >
                      <span className="line-clamp-1">{map.name}</span>
                    </Badge>
                  ))}
                  {scrimmage.selectedMaps.length > 3 && (
                    <Badge variant="secondary" className="text-xs font-normal">
                      +{scrimmage.selectedMaps.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          )}

          {scrimmage.message && (
            <div className="pt-2 border-t">
              <div className="flex items-start gap-2 text-xs sm:text-sm">
                <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium mb-1 text-foreground">Message</p>
                  <p className="text-muted-foreground line-clamp-2 break-words">
                    {scrimmage.message}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col items-stretch gap-2 p-3 sm:p-4 pt-2 sm:pt-3">
        {isChallenged && isTeamCaptain && (
          <div className="flex gap-2 w-full">
            <Button
              variant="default"
              className="flex-1"
              onClick={() => onAccept?.(scrimmage._id)}
            >
              Accept
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onReject?.(scrimmage._id)}
            >
              Decline
            </Button>
          </div>
        )}

        {isChallenger && (
          <CancelConfirmationDialog
            teamName={scrimmage.challengedTeam?.name || "the other team"}
            onConfirm={() => onCancel?.(scrimmage._id)}
          />
        )}

        {!isChallenged && !isChallenger && (
          <Button variant="outline" size="sm" asChild className="w-full">
            <Link
              href={`/tournaments/scrimmages/${
                scrimmage.scrimmageId || scrimmage._id
              }`}
            >
              View Details
            </Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
