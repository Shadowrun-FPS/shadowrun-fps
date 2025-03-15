import { AlertTriangle, Ban, History } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PlayerCardProps {
  player: {
    id: string;
    name: string;
    lastActive: string;
    warnings: number;
  };
  onWarn: (playerId: string) => void;
  onBan: (playerId: string) => void;
  onViewHistory: (playerId: string) => void;
}

export function PlayerCard({
  player,
  onWarn,
  onBan,
  onViewHistory,
}: PlayerCardProps) {
  return (
    <div className="p-4 border rounded-lg bg-card max-w-[95vw] md:max-w-none mx-auto">
      <div className="flex flex-col space-y-2">
        <div className="font-medium">{player.name}</div>
        <div className="text-sm text-muted-foreground break-all">
          {player.id}
        </div>
        <div className="text-sm">Last active: {player.lastActive}</div>
        <div className="text-sm">Warnings: {player.warnings}</div>

        {/* Player actions */}
        <div className="flex flex-wrap gap-2 mt-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 min-w-[80px] max-w-[110px]"
            onClick={() => onWarn(player.id)}
          >
            <AlertTriangle className="mr-1 h-4 w-4" />
            Warn
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 min-w-[80px] max-w-[110px]"
            onClick={() => onBan(player.id)}
          >
            <Ban className="mr-1 h-4 w-4" />
            Ban
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 min-w-[80px] max-w-[110px]"
            onClick={() => onViewHistory(player.id)}
          >
            <History className="mr-1 h-4 w-4" />
            History
          </Button>
        </div>
      </div>
    </div>
  );
}
