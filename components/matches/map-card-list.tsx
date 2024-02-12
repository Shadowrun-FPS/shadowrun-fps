import MapCard from "./map-card";
import { Map, MapResults } from "@/types/types";
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
}

export default function MapCardList({
  maps,
  results,
  className,
}: MapCardListProps) {
  return (
    <Carousel className={`${className}`}>
      <CarouselContent>
        {maps.map((map: Map, index: number) => (
          <CarouselItem className="md:basis-1/3" key={index}>
            <MapCard index={index} map={map} results={results} />
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  );
}
