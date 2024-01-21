import MapCard from "./map-card";
import { Map } from "@/types/types";

interface MapCardListProps {
  maps: Map[];
}

export default async function MapCardList({ maps }: MapCardListProps) {
  return (
    <main className="flex flex-col items-center justify-center w-full py-8">
      <h1 className="mb-8 text-4xl font-bold">Maps</h1>
      <div className="flex flex-wrap gap-16">
        {maps.map((map: Map, index: number) => (
          <MapCard key={index} className="w-64" map={map} />
        ))}
      </div>
    </main>
  );
}
