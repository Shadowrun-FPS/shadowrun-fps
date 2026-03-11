import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Trophy,
  TrendingUp,
  TrendingDown,
  Minus,
  Shield,
  RefreshCw,
  Loader2,
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
  onRefreshElo?: () => void;
  isRefreshingElo?: boolean;
  showRefreshElo?: boolean;
}

export default function TeamHeader({
  teamName,
  teamTag,
  teamElo,
  wins = 0,
  losses = 0,
  onRefreshElo,
  isRefreshingElo = false,
  showRefreshElo = false,
}: TeamHeaderProps) {
  const winsNum = Number(wins);
  const lossesNum = Number(losses);

  const totalGames = winsNum + lossesNum;
  let winPercentage = 0;

  if (totalGames > 0) {
    winPercentage = (winsNum / totalGames) * 100;
    if (winsNum === 1 && lossesNum === 0) winPercentage = 100;
    winPercentage = Math.round(winPercentage);
  }

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
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center justify-center rounded-2xl border border-border/50 bg-card/50 p-3 shadow-sm shrink-0">
            <Shield className="h-6 w-6 text-primary sm:h-7 sm:w-7" />
          </div>
          <div className="min-w-0">
            <h1
              className="truncate text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl"
              title={teamName}
            >
              {teamName}
            </h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <Badge
                variant="secondary"
                className="border-border/50 text-xs font-medium sm:text-sm"
              >
                [{teamTag}]
              </Badge>
              <span className="text-xs text-muted-foreground">Team</span>
            </div>
          </div>
        </div>

        <div className="flex w-full shrink-0 flex-row justify-end gap-2 sm:w-auto sm:gap-3">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Card className="cursor-help border border-border/50 bg-card/50 p-3 shadow-sm transition-colors hover:bg-muted/30 sm:p-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Trophy className="h-4 w-4 shrink-0 text-primary sm:h-5 sm:w-5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Record</p>
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <p className="text-sm font-bold text-foreground sm:text-base">
                          {winsNum}-{lossesNum}
                        </p>
                        <RecordIcon
                          className={`h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4 ${recordColor}`}
                        />
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

            {teamElo !== undefined && (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Card className="border border-border/50 bg-card/50 p-3 shadow-sm sm:p-4">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <TrendingUp className="h-4 w-4 shrink-0 text-primary sm:h-5 sm:w-5" />
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Team ELO
                          </p>
                          <p className="text-sm font-bold text-foreground sm:text-base">
                            {typeof teamElo === "number"
                              ? teamElo.toLocaleString()
                              : parseInt(
                                  (teamElo as string) || "0",
                                  10
                                ).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </Card>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <div className="max-w-[220px] text-sm">
                      <p className="font-medium">Team ELO</p>
                      <p className="text-muted-foreground">
                        Combined skill rating used for matchmaking and rankings.
                      </p>
                    </div>
                  </TooltipContent>
                </Tooltip>

                {showRefreshElo && onRefreshElo && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onRefreshElo}
                    disabled={isRefreshingElo}
                    className="h-9 border-border/50 sm:h-10"
                    aria-label="Refresh team ELO"
                  >
                    {isRefreshingElo ? (
                      <Loader2 className="h-4 w-4 animate-spin sm:h-5 sm:w-5" />
                    ) : (
                      <RefreshCw className="h-4 w-4 sm:h-5 sm:w-5" />
                    )}
                  </Button>
                )}
              </>
            )}
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
}
