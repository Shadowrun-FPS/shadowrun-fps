import React, { ReactNode } from "react";
import clientPromise from "@/lib/mongodb";
import Image from "next/image";

type rankedMaps = {
  map: string;
  captureGameMode: string;
  rankedMap: boolean;
  smallOption: boolean;
  src: string;
};

const MapCardTitle: React.FC<{ children: ReactNode }> = ({ children }) => (
  <h2 className="text-xl font-bold">{children}</h2>
);

const MapCardHeader: React.FC<{ children: ReactNode }> = ({ children }) => (
  <div>{children}</div>
);

const MapCardContent: React.FC<{ children: ReactNode }> = ({ children }) => (
  <div>{children}</div>
);

interface MapCardProps {
  children?: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const MapCard: React.FC<MapCardProps> = ({ children, className, style }) => (
  <div
    className={`flex flex-col items-center justify-center ${className}`}
    style={style}
  >
    {children}
  </div>
);

const getRandomMaps = (maps: rankedMaps[], n: number): rankedMaps[] => {
  const shuffled = maps.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, n);
};

export async function getMapCard(): Promise<rankedMaps[]> {
  const client = await clientPromise;
  const db = client.db("ShadowrunWeb");
  const mapPick = await db
    .collection("Maps")
    .find({ rankedMap: true })
    .toArray();
  return mapPick as unknown as rankedMaps[];
}

export default async function MapCardComponent() {
  const mapData = await getMapCard();
  const selectedMaps: rankedMaps[] = getRandomMaps(mapData, 3);

  return (
    <main className="flex flex-col items-center justify-center w-full py-8">
      <h1 className="mb-8 text-4xl font-bold">Maps</h1>
      <div className="grid grid-cols-3 gap-16 text-center">
        {selectedMaps.map((map: rankedMaps, index: number) => (
          <MapCard
            key={index}
            className="w-full max-w-md"
            style={{
              height: "auto",
              border: "none",
              marginBottom: "10px",
            }}
          >
            <MapCardHeader>
              <MapCardTitle>{map.map}</MapCardTitle>
            </MapCardHeader>
            <MapCardContent>
              <Image
                alt={`${map.map} Map`}
                height={200}
                src={map.src}
                style={{
                  aspectRatio: "1",
                  objectFit: "cover",
                  marginBottom: "1px",
                }}
                width={500}
              />
            </MapCardContent>
          </MapCard>
        ))}
      </div>
    </main>
  );
}
