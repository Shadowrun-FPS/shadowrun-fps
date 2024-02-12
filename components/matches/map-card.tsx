import React, { ReactNode } from "react";
import clientPromise from "@/lib/mongodb";
import Image from "next/image";
import { Map } from "@/types/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import SubmitScoresDialog from "@/app/matches/[matchId]/submit-scores-dialog";

interface MapCardProps {
  className?: string;
  style?: React.CSSProperties;
  map: Map;
  index: number;
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

export default async function MapCard({
  className,
  style,
  map,
  index,
}: MapCardProps) {
  const mapDetails = await getMapData(map.name);
  if (mapDetails === null) return <div>Unknown Map!</div>;

  return (
    <Card className={`${className}`}>
      <CardHeader>
        <CardTitle>{mapDetails.name}</CardTitle>
        <CardDescription>{`Map ${index + 1}`}</CardDescription>
      </CardHeader>
      <CardContent>
        <Image
          alt={`${mapDetails.name} Map`}
          src={mapDetails.src}
          width={1175}
          height={500}
        />
        {/*TODO: show map results here*/}
      </CardContent>
      <CardFooter className="grid">
        {/*TODO: show submit scores buttons for each team, team 1 and team 2 */}
        <h2 className="text-xl font-bold text-center">Submit scores</h2>
        <div className="grid grid-cols-2 gap-4">
          <SubmitScoresDialog index={index} team={"Team 1"} />
          <SubmitScoresDialog index={index} team={"Team 2"} />
        </div>
      </CardFooter>
    </Card>
  );
}
