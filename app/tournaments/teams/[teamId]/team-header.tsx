import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Users, Trophy, Activity } from "lucide-react";

interface TeamHeaderProps {
  teamName: string;
  teamTag: string;
  teamElo?: number | string;
}

export default function TeamHeader({
  teamName,
  teamTag,
  teamElo,
}: TeamHeaderProps) {
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
  );
}
