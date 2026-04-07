import Link from "next/link";
import {
  ArrowDown,
  ArrowUp,
  Crown,
  Medal,
  TrendingUp,
  Trophy,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { calculateWinRatePct } from "@/lib/rankings-sort";
import type { TeamRankingRow } from "@/types/rankings";

function medalClass(rank: number): string {
  switch (rank - 1) {
    case 0:
      return "text-yellow-500 fill-yellow-500";
    case 1:
      return "text-gray-400 fill-gray-400";
    case 2:
      return "text-amber-600 fill-amber-600";
    default:
      return "text-muted-foreground";
  }
}

type RankingsTeamRowProps = {
  team: TeamRankingRow;
  teamRank: number | null;
  playerStatsEnabled: boolean;
};

export function RankingsTeamRow({
  team,
  teamRank,
  playerStatsEnabled,
}: RankingsTeamRowProps) {
  const wins = Number(team.wins || 0);
  const losses = Number(team.losses || 0);
  const totalGames = wins + losses;
  const memberCount = team.members?.length || 0;
  const captainName =
    team.captain?.discordNickname ||
    team.captain?.discordUsername ||
    "Unknown";
  const captainUsername = team.captain?.discordUsername
    ? team.captain.discordUsername.toLowerCase().replace(/\s+/g, "")
    : team.captain?.discordNickname
      ? team.captain.discordNickname.toLowerCase().replace(/\s+/g, "")
      : null;
  const captainProfileUrl =
    captainUsername && playerStatsEnabled
      ? `/player/stats?playerName=${encodeURIComponent(captainUsername)}`
      : null;

  const teamSize = team.teamSize || 4;

  return (
    <div className="group relative border-b border-border/50 px-4 py-4 transition-all last:border-b-0 hover:bg-gradient-to-r hover:from-primary/5 hover:to-transparent sm:px-6">
      <div className="absolute inset-y-0 left-0 w-1 bg-primary/0 transition-colors group-hover:bg-primary/30" />
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="flex max-w-[300px] min-w-0 flex-1 shrink-0 items-center gap-3 lg:gap-4">
          <div className="flex w-10 shrink-0 items-center justify-center lg:w-12">
            {teamRank !== null && teamRank <= 3 ? (
              <div className="relative">
                <div
                  className={`relative flex items-center justify-center rounded-full p-1.5 lg:p-2 ${
                    teamRank === 1
                      ? "border-2 border-yellow-400/50 bg-gradient-to-br from-yellow-500/20 via-yellow-400/10 to-yellow-500/20 shadow-lg shadow-yellow-400/30 ring-2 ring-yellow-400/20"
                      : teamRank === 2
                        ? "border-2 border-gray-300/50 bg-gradient-to-br from-gray-300/20 via-gray-200/10 to-gray-300/20 shadow-lg shadow-gray-300/30 ring-2 ring-gray-300/20"
                        : "border-2 border-amber-600/50 bg-gradient-to-br from-amber-600/20 via-amber-500/10 to-amber-600/20 shadow-lg shadow-amber-600/30 ring-2 ring-amber-600/20"
                  }`}
                >
                  <Medal
                    className={`h-6 w-6 drop-shadow-lg lg:h-7 lg:w-7 ${medalClass(teamRank)}`}
                  />
                  {teamRank === 1 ? (
                    <Crown className="absolute -right-1 -top-1 z-10 h-4 w-4 text-yellow-400 drop-shadow-md" />
                  ) : null}
                </div>
              </div>
            ) : (
              <span className="text-lg font-bold text-muted-foreground lg:text-xl">
                #{teamRank ?? "?"}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-baseline gap-2">
              <Link
                href={`/tournaments/teams/${team._id}`}
                className="whitespace-nowrap text-base font-bold hover:text-primary hover:underline lg:text-lg"
              >
                {team.name}
              </Link>
              {team.tag ? (
                <Badge
                  variant="secondary"
                  className="shrink-0 font-mono text-xs leading-none lg:text-sm"
                >
                  [{team.tag}]
                </Badge>
              ) : null}
            </div>
            <div className="flex items-baseline gap-1.5 text-xs text-muted-foreground lg:text-sm">
              <Crown className="relative top-0.5 h-3 w-3 shrink-0" />
              {playerStatsEnabled && captainProfileUrl ? (
                <Link
                  href={captainProfileUrl}
                  className="hover:text-primary hover:underline"
                >
                  {captainName}
                </Link>
              ) : (
                <span>{captainName}</span>
              )}
            </div>
          </div>
        </div>

        <div className="ml-12 grid grid-cols-2 gap-3 lg:ml-auto lg:w-[600px] lg:shrink-0 lg:grid-cols-5 lg:gap-4">
          <div className="col-span-2 flex flex-col items-center justify-center rounded-lg border border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5 p-2 lg:col-span-1 lg:items-end lg:p-3">
            <div className="mb-1 flex w-full items-center gap-1.5 lg:justify-end">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium text-muted-foreground lg:hidden">
                ELO
              </span>
            </div>
            <span className="w-full text-right text-base font-bold lg:text-lg">
              {(team.teamElo || team.calculatedElo || 0).toLocaleString()}
            </span>
          </div>

          <div className="flex flex-col items-center justify-center rounded-lg border border-border/60 bg-muted/20 p-2 lg:items-end lg:p-3">
            <div className="mb-1 flex w-full items-center gap-1.5 lg:justify-end">
              <div className="flex items-center gap-1">
                <ArrowUp className="h-3 w-3 text-primary" />
                <span className="text-xs font-medium text-primary">{wins}</span>
              </div>
              <span className="text-muted-foreground">-</span>
              <div className="flex items-center gap-1">
                <ArrowDown className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">
                  {losses}
                </span>
              </div>
              <span className="ml-1 text-xs font-medium text-muted-foreground lg:hidden">
                Record
              </span>
            </div>
            <span className="w-full text-right text-xs text-muted-foreground">
              {totalGames} {totalGames === 1 ? "game" : "games"}
            </span>
          </div>

          <div className="flex flex-col items-center justify-center rounded-lg border border-primary/15 bg-gradient-to-br from-primary/10 to-transparent p-2 lg:items-end lg:p-3">
            <div className="mb-1 flex w-full items-center gap-1.5 lg:justify-end">
              <Trophy className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium text-muted-foreground lg:hidden">
                Win rate
              </span>
            </div>
            <span className="w-full text-right text-base font-bold text-primary lg:text-lg">
              {calculateWinRatePct(wins, losses)}
            </span>
          </div>

          <div className="flex flex-col items-center justify-center rounded-lg border border-border/60 bg-secondary/25 p-2 lg:items-end lg:p-3">
            <div className="mb-1 flex w-full items-center gap-1.5 lg:justify-end">
              <Trophy className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium text-muted-foreground lg:hidden">
                Tourn. wins
              </span>
            </div>
            <span className="w-full text-right text-base font-bold lg:text-lg">
              {team.tournamentWins || 0}
            </span>
          </div>

          <div className="flex flex-col items-center justify-center rounded-lg border border-border/60 bg-muted/30 p-2 lg:items-end lg:p-3">
            <div className="mb-1 flex w-full items-center gap-1.5 lg:justify-end">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium text-muted-foreground lg:hidden">
                Members
              </span>
            </div>
            <span className="w-full text-right text-base font-bold lg:text-lg">
              {memberCount}/{teamSize}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
