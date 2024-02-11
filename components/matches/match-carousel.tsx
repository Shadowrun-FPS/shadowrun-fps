import MatchCard from "@/components/matches/match-card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import { Match, Queue } from "@/types/types";
import QueueCard from "./queue-card";

export default function MatchCarousel({
  className,
  carouselItemClass,
  matches,
}: {
  className?: string;
  carouselItemClass?: string;
  matches: Match[];
}) {
  return (
    <Carousel className={className} opts={{ align: "start" }}>
      <CarouselContent>
        <CarouselItem className={"md:basis-1/2 lg:basis-1/3"}>
          <QueueCard
            className="h-[300px] w-[260px]"
            teamSize={4}
            gameType="ranked"
          />
        </CarouselItem>
        {matches.map((match: Match, index: number) => (
          <CarouselItem
            key={index + 1}
            className={"-ml-4 md:basis-1/2 lg:basis-1/3"}
          >
            <MatchCard className={"h-[300px] w-[260px]"} match={match} />
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  );
}
