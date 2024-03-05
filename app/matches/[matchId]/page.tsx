import clientPromise from "@/lib/mongodb";
import { Match } from "@/types/types";
import { Metadata } from "next";
import MapCardList from "@/components/matches/map-card-list";
import PlayerList from "@/components/player/player-list";
import MatchDetails from "@/components/matches/match-details";

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
  // TODO: add players in match to header
  return (
    <div className="grid gap-8 mb-12">
      <h1 className="text-3xl font-extrabold">Match Details: {match.title}</h1>
      <div id="match-detail-header" className="grid gap-4 md:grid-cols-2">
        <MatchDetails
          status={match.status}
          eloTier={match.eloTier}
          winner={match.winner}
        />
        <PlayerList
          className="grid w-[350px] md:grid-cols-2"
          players={match.players}
          teamSize={match.teamSize}
        />
      </div>
      <div className="grid justify-center m-8">
        <MapCardList
          className="w-[250px] md:w-auto"
          maps={match.maps}
          results={match.results}
          players={match.players}
        />
      </div>
    </div>
  );
}
