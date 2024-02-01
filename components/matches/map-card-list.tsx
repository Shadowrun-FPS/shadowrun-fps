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

export default function MapCardList({ maps, className }: MapCardListProps) {
  return (
    <Carousel className={`${className}`}>
      <CarouselContent>
        {maps.map((map: Map, index: number) => (
          <CarouselItem className="" key={index}>
            <div>
              <div className="p-2 text-lg font-bold text-center text-white rounded-full">
                Map {index + 1}
              </div>
              <MapCard map={map} index={index} />
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  );
}
