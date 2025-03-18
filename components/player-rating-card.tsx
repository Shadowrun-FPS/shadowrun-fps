import React from "react";
import { Card, CardContent } from "@/components/ui/card";

interface PlayerRatingProps {
  title: string;
  rating: number;
  matches?: number;
  wins: number;
  losses: number;
  tier: string;
  progress: number;
}

export function PlayerRatingCard({
  title,
  rating,
  matches,
  wins,
  losses,
  tier,
  progress,
}: PlayerRatingProps) {
  const actualMatches = matches || wins + losses;
  const winRate =
    actualMatches > 0 ? Math.round((wins / actualMatches) * 100) : 0;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-lg font-medium">{title} Rating</h3>
        </div>

        <div className="flex flex-col">
          <div className="flex items-baseline mb-4">
            <span className="text-5xl font-bold text-primary">{rating}</span>
          </div>

          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">{tier}</span>
            <span className="text-sm text-muted-foreground">
              {tier === "Obsidian" ? "Master" : "Next Tier"}
            </span>
          </div>

          <div className="w-full h-2 mb-6 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary"
              style={{ width: `${progress}%` }}
            ></div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="p-4 text-center rounded-md bg-muted/50">
              <div className="text-lg font-semibold">{actualMatches}</div>
              <div className="text-xs text-muted-foreground">Matches</div>
            </div>
            <div className="p-4 text-center rounded-md bg-muted/50">
              <div className="text-lg font-semibold text-green-500">{wins}</div>
              <div className="text-xs text-muted-foreground">Wins</div>
            </div>
            <div className="p-4 text-center rounded-md bg-muted/50">
              <div className="text-lg font-semibold text-red-500">{losses}</div>
              <div className="text-xs text-muted-foreground">Losses</div>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-md bg-muted/30">
            <span className="text-sm">Win Rate</span>
            <span className="font-medium">{winRate}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
