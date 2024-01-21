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
    <div
      className={`flex flex-col items-center justify-center ${className}`}
      style={style}
    >
      <h2 className="text-xl font-bold">{mapDetails.name}</h2>
      <Image
        alt={`${mapDetails.name} Map`}
        height={200}
        src={mapDetails.src}
        style={{
          aspectRatio: "1",
          objectFit: "cover",
          marginBottom: "1px",
        }}
        width={500}
      />
    </div>
  );
}
