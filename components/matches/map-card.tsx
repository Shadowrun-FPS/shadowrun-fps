import React, { ReactNode } from "react";
import clientPromise from "@/lib/mongodb";
import Image from "next/image";
import { Map, MapResult, MatchPlayer } from "@/types/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import SubmitScoresDialog from "@/app/matches/[matchId]/submit-scores-dialog";
import { DisplayMapResults } from "@/app/matches/[matchId]/display-map-results";

interface MapCardProps {
  className?: string;
  style?: React.CSSProperties;
  map: Map;
  index: number;
  results?: MapResult[];
  players: MatchPlayer[];
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
  index,
  map,
  results,
  players,
}: MapCardProps) {
  const mapDetails = await getMapData(map.name);
  if (mapDetails === null) return <div>Unknown Map!</div>;

  const mapResults = results?.filter((result) => result.map === index + 1);

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
        {results && (
          <div>
            <h3 className="prose dark:prose-invert">Results</h3>
            {mapResults?.map((result: MapResult, index: number) => (
              <DisplayMapResults key={index} result={result} />
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="grid">
        <h2 className="text-xl font-bold text-center">Submit scores</h2>
        <div className="grid grid-cols-2 gap-4">
          <SubmitScoresDialog index={index} team={"Team 1"} />
          <SubmitScoresDialog index={index} team={"Team 2"} />
        </div>
      </CardFooter>
    </Card>
  );
}
