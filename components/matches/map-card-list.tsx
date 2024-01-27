import MapCard from "./map-card";
import { Map } from "@/types/types";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface MapCardListProps {
  maps: Map[];
  className?: string;
  style?: React.CSSProperties;
}

export default async function MapCardList({
  maps,
  className,
}: MapCardListProps) {
  return (
    <Carousel className={`${className}`}>
      <CarouselContent>
        {maps.map((map: Map, index: number) => (
          <CarouselItem key={index}>
            <MapCard map={map} index={index} />
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  );
}
