import MapCard from "./map-card";
import { Map, MapResults, MatchPlayer } from "@/types/types";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface MapCardListProps {
  className?: string;
  maps: Map[];
  results?: MapResults[];
  players: MatchPlayer[];
}

export default function MapCardList({
  className,
  maps,
  results,
  players,
}: MapCardListProps) {
  return (
    <Carousel className={`${className}`}>
      <CarouselContent>
        {maps.map((map: Map, index: number) => (
          <CarouselItem className="md:basis-1/3" key={index}>
            <MapCard
              index={index}
              map={map}
              results={results}
              players={players}
            />
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  );
}
