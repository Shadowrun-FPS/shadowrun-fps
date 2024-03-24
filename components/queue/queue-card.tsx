import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { GameType } from "@/types/types";
import QueueButton from "./queue-button";
import { getQueues } from "@/lib/queue-helpers";
import { unstable_cache } from "next/cache";

type QueueCardProps = {
  className?: string;
  teamSize: number;
  gameType: GameType;
};

// TODO: revalidate queues cache ever 15 seconds
const getQueueData = unstable_cache(
  // Reference of how to cache server actions with a tag
  async (teamSize, gameType) => getQueues(teamSize, gameType),
  [],
  { tags: ["queues"] }
);

export default async function QueueCard({
  className,
  teamSize,
  gameType,
}: QueueCardProps) {
  const queueData = await getQueueData(teamSize, gameType);
  return (
    <Card className={`flex flex-col ${className}`}>
      <div className="flex flex-col h-full">
        <CardHeader className="prose dark:prose-invert">
          <CardTitle className="my-2">Queues</CardTitle>
        </CardHeader>

        <CardContent className="grid flex-grow gap-4">
          {queueData.map((queue, index) => (
            <QueueButton
              key={index}
              queueId={queue.queueId}
              eloTier={queue.eloTier}
              minElo={queue.minElo}
              maxElo={queue.maxElo}
              players={queue.players}
              teamSize={queue.teamSize}
            />
          ))}
        </CardContent>
      </div>
    </Card>
  );
}
