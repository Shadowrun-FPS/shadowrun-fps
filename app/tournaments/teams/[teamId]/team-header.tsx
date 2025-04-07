import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Users,
  Trophy,
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TeamHeaderProps {
  teamName: string;
  teamTag: string;
  teamElo: number;
  wins?: number;
  losses?: number;
}

export default function TeamHeader({
  teamName,
  teamTag,
  teamElo,
  wins = 0,
  losses = 0,
}: TeamHeaderProps) {
  // Ensure wins and losses are numbers
  const winsNum = Number(wins);
  const lossesNum = Number(losses);

  // Calculate win percentage with explicit handling for 100% case
  const totalGames = winsNum + lossesNum;
  let winPercentage = 0;

  if (totalGames > 0) {
    // Calculate exact percentage
    winPercentage = (winsNum / totalGames) * 100;

    // Special case for 1-0 record (100% win rate)
    if (winsNum === 1 && lossesNum === 0) {
      winPercentage = 100;
    }

    // Round to nearest integer
    winPercentage = Math.round(winPercentage);
  }

  // Determine record status icon and color
  const getRecordStatus = () => {
    if (winsNum > lossesNum)
      return { icon: TrendingUp, color: "text-green-500" };
    if (lossesNum > winsNum)
      return { icon: TrendingDown, color: "text-red-500" };
    return { icon: Minus, color: "text-yellow-500" };
  };

  const { icon: RecordIcon, color: recordColor } = getRecordStatus();

  return (
    <div className="mb-8">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{teamName}</h1>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="secondary" className="text-sm font-semibold">
              {teamTag}
            </Badge>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Users className="w-4 h-4" />
              <span className="text-sm">Team</span>
            </div>
          </div>
        </div>

        <div className="flex flex-row justify-end w-full gap-3 sm:w-auto">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Card className="p-3 transition-colors border shadow-sm bg-card hover:bg-accent/50 cursor-help">
                  <div className="flex items-center gap-3">
                    <Activity className="w-4 h-4 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Record</p>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">
                          {winsNum}-{lossesNum}
                        </p>
                        <RecordIcon className={`w-3.5 h-3.5 ${recordColor}`} />
                      </div>
                    </div>
                  </div>
                </Card>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <div className="text-sm">
                  <p className="font-medium">Team Performance</p>
                  <p>Win rate: {winPercentage}%</p>
                  <p>Total matches: {totalGames}</p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {teamElo !== undefined && (
            <Card className="p-3 border shadow-sm bg-card">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Team ELO</p>
                  <p className="font-semibold">
                    {typeof teamElo === "number"
                      ? teamElo.toLocaleString()
                      : parseInt((teamElo as string) || "0").toLocaleString()}
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
