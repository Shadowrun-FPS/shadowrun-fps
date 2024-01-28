import { MapResults, Match } from "@/types/types";
import { DisplayMapResults } from "./display-map-results";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function DisplayMatchResults({
  results,
}: {
  results: MapResults[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Match Results</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-8 overflow-auto max-h-96">
          {results.map((result) => (
            <DisplayMapResults key={result.map} result={result} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
