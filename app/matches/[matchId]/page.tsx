import clientPromise from "@/lib/mongodb";
import { Match } from "@/types/types";
import { Metadata } from "next";
import MatchDetailsCard from "./match-details-card";
import MapCardList from "@/components/matches/map-card-list";

export const metadata: Metadata = {
  title: "View Match Details",
};

const getMatchDetails = async (matchId: string) => {
  try {
    const client = await clientPromise;
    const db = client.db("ShadowrunWeb");
    const matchData = await db
      .collection("Matches")
      .findOne({ matchId: matchId });
    return matchData as unknown as Match;
  } catch (error) {
    console.error(error);
    return null;
  }
};

export default async function MatchDetailsPage({
  params,
}: {
  params: { matchId: string };
}) {
  const matchId = params.matchId;
  const match = await getMatchDetails(matchId);
  // console.log("match: ", matchData);
  if (match === null) {
    return (
      <div className="grid items-center gap-4">No Match Found {matchId}</div>
    );
  }
  return (
    <div className="grid gap-8 mb-12">
      <div className="grid gap-4 p-4">
        <h1 className="text-3xl font-extrabold">
          Match Details: {match.title}
        </h1>
        <div>
          <p>
            <strong>Status:</strong> {match.status}
          </p>
          <p>
            <strong>ELO Tier:</strong> {match.eloTier}
          </p>
          {match.winner && (
            <p>
              <strong>{match.winner} Winner!</strong>
            </p>
          )}
        </div>
      </div>
      <div className="grid justify-center m-8">
        <MapCardList className="w-[250px] md:w-auto" maps={match.maps} />
      </div>
    </div>
  );
}
