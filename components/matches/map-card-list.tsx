import MapCard from "./map-card";
import { Map } from "@/types/types";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MapCardListProps {
  maps: Map[];
  className?: string;
  style?: React.CSSProperties;
}

export default async function MapCardList({
  maps,
  className,
  style,
}: MapCardListProps) {
  return (
    <Card className={className} style={style}>
      <CardHeader>
        <CardTitle title={"Maps"}>Maps</CardTitle>
      </CardHeader>
      <CardContent className="prose dark:prose-invert">
        <div className="overflow-y-auto h-80">
          {maps.map((map: Map, index: number) => (
            <MapCard
              key={index}
              className="flex-shrink-0 w-64 h-40 m-2 rounded-lg"
              map={map}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
