import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Users,
  Trophy,
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  Shield,
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
    <div className="mb-6 sm:mb-8">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="relative p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 border-2 border-primary/30 shadow-lg shadow-primary/10 shrink-0">
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/40 to-transparent opacity-50" />
            <Shield className="relative w-6 h-6 sm:w-7 sm:h-7 text-primary drop-shadow-sm" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-foreground to-foreground/80">
              {teamName}
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="text-xs sm:text-sm font-semibold border-2">
                [{teamTag}]
              </Badge>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="text-xs sm:text-sm">Team</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-row justify-end w-full gap-2 sm:gap-3 sm:w-auto">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Card className="p-3 sm:p-4 transition-all border-2 shadow-sm bg-gradient-to-br from-card via-card to-primary/5 hover:bg-accent/50 hover:shadow-md cursor-help">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Record</p>
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <p className="font-bold text-sm sm:text-base">
                          {winsNum}-{lossesNum}
                        </p>
                        <RecordIcon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${recordColor} shrink-0`} />
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
            <Card className="p-3 sm:p-4 border-2 shadow-sm bg-gradient-to-br from-card via-card to-primary/5">
              <div className="flex items-center gap-2 sm:gap-3">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Team ELO</p>
                  <p className="font-bold text-sm sm:text-base">
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
