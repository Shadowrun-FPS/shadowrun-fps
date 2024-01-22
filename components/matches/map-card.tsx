import React, { ReactNode } from "react";
import clientPromise from "@/lib/mongodb";
import Image from "next/image";
import { Map } from "@/types/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MapCardProps {
  map: Map;
  className?: string;
  style?: React.CSSProperties;
}

export async function getMapData(name: string): Promise<Map | null> {
  try {
    const client = await clientPromise;
    const db = client.db("ShadowrunWeb");
    const mapData = await db.collection("Maps").findOne({ name: name });
    return mapData as unknown as Map;
  } catch (e) {
    console.error("Unable to find map details.");
    return null;
  }
}

export default async function MapCard({ map, className, style }: MapCardProps) {
  const mapDetails = await getMapData(map.name);
  if (mapDetails === null) return <div>Unknown Map!</div>;

  return (
    <Card className={`${className}`}>
      <CardHeader>
        <CardTitle>{mapDetails.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <Image
          alt={`${mapDetails.name} Map`}
          src={mapDetails.src}
          width={1175}
          height={500}
        />
      </CardContent>
    </Card>
  );
}
