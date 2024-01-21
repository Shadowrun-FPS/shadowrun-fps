import React, { ReactNode } from "react";
import clientPromise from "@/lib/mongodb";
import Image from "next/image";
import { Map } from "@/types/types";

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
    <div className={`${className}`} style={style}>
      <h2 className="mt-0 mb-0 text-xl font-bold">{mapDetails.name}</h2>
      <Image
        alt={`${mapDetails.name} Map`}
        src={mapDetails.src}
        width={1175}
        height={500}
      />
    </div>
  );
}
