import MatchCard from "@/components/matches/match-card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import { Match } from "@/types/types";

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
    <Carousel className={`${className}`}>
      <CarouselContent>
        {matches.map((match: Match, index: number) => (
          <CarouselItem className={`${carouselItemClass}`} key={index}>
            <MatchCard match={match} />
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  );
}
