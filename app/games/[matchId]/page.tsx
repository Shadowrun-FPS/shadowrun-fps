import PlayerList from "@/components/player/player-list";
import clientPromise from "@/lib/mongodb";
import { Map, Match, Player } from "@/types/types";
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
  const matchData = await getMatchDetails(matchId);
  console.log("match: ", matchData);
  if (matchData === null) {
    return (
      <div className="grid items-center gap-4">No Match Found {matchId}</div>
    );
  }
  return (
    <div className="grid gap-8 mb-12">
      <h1 className="p-4 text-3xl font-extrabold prose dark:prose-invert">
        View Match Details
      </h1>
      <div className="grid justify-center gap-8 md:grid-cols-2">
        <MatchDetailsCard match={matchData} />
        <PlayerList match={matchData} />
      </div>
      <div className="grid justify-center">
        <h2 className="p-4 mx-4 text-2xl font-extrabold">Maps</h2>
        <MapCardList className="max-w-sm md:max-w-xl" maps={matchData.maps} />
      </div>
    </div>
  );
}
