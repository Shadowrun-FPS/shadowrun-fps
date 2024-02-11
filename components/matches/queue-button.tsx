import { Button } from "@/components/ui/button";
import { EloTier } from "@/types/types";
import { Users } from "lucide-react";

export default function QueueButton({
  eloTier,
  playersInQueue,
  teamSize,
}: {
  eloTier: EloTier;
  playersInQueue: number;
  teamSize: number;
}) {
  return (
    <div className="flex items-center gap-4">
      <Users />
      <div className="flex-1">
        <h3 className="font-semibold">{eloTier}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {`In queue ${playersInQueue}/${teamSize * 2}`}
        </p>
      </div>
      <Button size="sm">Queue</Button>
    </div>
  );
}
