import MatchCard from "@/components/matches/match-card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import { Match } from "@/types/types";
import QueueCard from "../queue/queue-card";

export default function MatchCarousel({
  className,
  matches,
}: {
  className?: string;
  matches: Match[];
}) {
  return (
    <Carousel className={className} opts={{ align: "start" }}>
      <CarouselContent>
        <CarouselItem className={"sm:basis-1/2 lg:basis-1/3"}>
          <div className="p-1">
            <QueueCard className={"h-[300px]"} teamSize={4} gameType="ranked" />
          </div>
        </CarouselItem>
        {matches.map((match: Match, index: number) => (
          <CarouselItem
            key={index + 1}
            className={"-ml-4 md:basis-1/2 lg:basis-1/3"}
          >
            <div className="p-1">
              <MatchCard className={"h-[300px]"} match={match} />
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  );
}
