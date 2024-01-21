import PlayerItem from "@/components/player/player-item";
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
    <div>
      <h1 className="p-4 text-3xl font-extrabold prose dark:prose-invert">
        View Match Details
      </h1>
      <div className="flex flex-wrap gap-8">
        <MatchDetailsCard className="w-96" match={matchData} />
        <MapCardList className="w-96" maps={matchData.maps} />

        <div className="max-w-sm p-4 prose rounded-lg shadow-lg bg-card dark:prose-invert">
          <h2 className="mb-2 text-xl font-semibold">Players</h2>
          <ul>
            {matchData.players.map((player: Player, index: number) => (
              <li key={index} className="mb-1">
                <PlayerItem
                  discordId={player.discordId}
                  matchTeamSize={matchData.teamSize}
                />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
