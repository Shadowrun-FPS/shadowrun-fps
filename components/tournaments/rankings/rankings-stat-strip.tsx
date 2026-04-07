import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Trophy, Users } from "lucide-react";
import type { TeamRankingRow } from "@/types/rankings";

const shell =
  "border-2 border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 shadow-sm";

type RankingsStatStripProps = {
  sortedTeams: TeamRankingRow[];
};

export function RankingsStatStrip({ sortedTeams }: RankingsStatStripProps) {
  const topElo =
    sortedTeams.length > 0
      ? Math.max(
          ...sortedTeams.map((t) => t.teamElo || t.calculatedElo || 0),
        )
      : 0;
  const activeCount = sortedTeams.filter(
    (t) => (t.wins || 0) + (t.losses || 0) > 0,
  ).length;
  const totalGames = sortedTeams.reduce((total, team) => {
    const wins = Number(team.wins || 0);
    const losses = Number(team.losses || 0);
    return total + wins + losses;
  }, 0);

  return (
    <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
      <Card className={shell}>
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <Trophy className="h-4 w-4 shrink-0 text-primary sm:h-5 sm:w-5" />
            <div>
              <p className="text-xs text-muted-foreground">Total teams</p>
              <p className="text-lg font-bold sm:text-xl">{sortedTeams.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className={shell}>
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <TrendingUp className="h-4 w-4 shrink-0 text-primary sm:h-5 sm:w-5" />
            <div>
              <p className="text-xs text-muted-foreground">Top ELO</p>
              <p className="text-lg font-bold sm:text-xl">
                {sortedTeams.length > 0 ? topElo.toLocaleString() : "0"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className={shell}>
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <Users className="h-4 w-4 shrink-0 text-primary sm:h-5 sm:w-5" />
            <div>
              <p className="text-xs text-muted-foreground">Active</p>
              <p className="text-lg font-bold sm:text-xl">{activeCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className={shell}>
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <Trophy className="h-4 w-4 shrink-0 text-primary sm:h-5 sm:w-5" />
            <div>
              <p className="text-xs text-muted-foreground">Total games</p>
              <p className="text-lg font-bold sm:text-xl">
                {totalGames.toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
