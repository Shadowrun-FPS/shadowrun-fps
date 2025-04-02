import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin } from "lucide-react";
import { format } from "date-fns";
import { toast } from "@/components/ui/use-toast";
import { CancelConfirmationDialog } from "./cancel-confirmation-dialog";

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
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">
            {scrimmage.challengerTeam?.name} vs {scrimmage.challengedTeam?.name}
          </CardTitle>
          <Badge variant="outline" className="ml-2">
            Pending
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="space-y-3">
          <div className="flex items-center text-sm">
            <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
            <span>{formattedDate}</span>
          </div>

          {scrimmage.selectedMaps && scrimmage.selectedMaps.length > 0 && (
            <div className="flex items-start text-sm">
              <MapPin className="w-4 h-4 mr-2 mt-0.5 text-muted-foreground" />
              <div>
                <p className="font-medium mb-1">Selected Maps:</p>
                <ul className="space-y-1">
                  {scrimmage.selectedMaps.map((map: any) => (
                    <li key={map.id}>{map.name}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {scrimmage.message && (
            <div className="mt-3 pt-3 border-t text-sm">
              <p className="font-medium mb-1">Message:</p>
              <p className="text-muted-foreground">{scrimmage.message}</p>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col items-stretch gap-2">
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
      </CardFooter>
    </Card>
  );
}
