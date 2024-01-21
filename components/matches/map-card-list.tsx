import MapCard from "./map-card";
import { Map } from "@/types/types";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MapCardListProps {
  maps: Map[];
  className?: string;
}

export default async function MapCardList({
  maps,
  className,
}: MapCardListProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle title={"Maps"}>Maps</CardTitle>
      </CardHeader>
      <CardContent className="prose dark:prose-invert">
        {maps.map((map: Map, index: number) => (
          <MapCard key={index} className="w-64" map={map} />
        ))}
      </CardContent>
    </Card>
  );
}
