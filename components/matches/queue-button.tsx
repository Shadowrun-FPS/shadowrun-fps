import { Button } from "@/components/ui/button";
import { EloTier } from "@/types/types";
import { Users } from "lucide-react";

export default function QueueButton({
  eloTier,
  minElo,
  maxElo,
  playersInQueue,
  teamSize,
}: {
  eloTier: EloTier;
  minElo: number;
  maxElo: number;
  playersInQueue: number;
  teamSize: number;
}) {
  return (
    <div className="flex items-center gap-4">
      <span className="hidden md:block">
        <Users />
      </span>

      <div className="flex-1">
        <h3 className="font-semibold">{eloTier}</h3>
        <p className="text-xs prose dark:prose-invert">
          {minElo}-{maxElo}
        </p>
      </div>
      <Button className="w-28" variant={"secondary"}>
        Queue {playersInQueue}/{teamSize * 2}
      </Button>
    </div>
  );
}
