import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "../ui/card";
import { GameType } from "@/types/types";
import QueueButton from "./queue-button";
import { getQueues } from "@/lib/queue-helpers";

type QueueCardProps = {
  className?: string;
  teamSize: number;
  gameType: GameType;
};

export default async function QueueCard({
  className,
  teamSize,
  gameType,
}: QueueCardProps) {
  const queueData = await getQueues(teamSize, gameType);
  console.log("queue data", { queueData });
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
              eloTier={queue.eloTier}
              playersInQueue={queue.players.length}
              teamSize={queue.teamSize}
            />
          ))}
        </CardContent>

        <CardFooter className="grid grid-cols-2 gap-4 mt-auto"></CardFooter>
      </div>
    </Card>
  );
}
