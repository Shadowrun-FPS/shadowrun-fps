import clientPromise from "@/lib/mongodb";
import { Metadata } from "next";
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
    return matchData;
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
  console.log("matchId: ", matchId);
  const matchData = await getMatchDetails(matchId);
  console.log("match: ", matchData);
  if (matchData === null) {
    return (
      <div className="grid items-center gap-4">No Match Found {matchId}</div>
    );
  }
  return (
    <div className="grid items-center gap-4">
      <h1 className="p-4 text-3xl font-extrabold">View Match Details</h1>
      <div className="container p-4 mx-auto">
        <div className="mb-6">
          <p>
            <strong>Match ID:</strong> {matchData.matchId}
          </p>
          <p>
            <strong>Game Mode:</strong> {matchData.gameMode}
          </p>
          <p>
            <strong>Queue ID:</strong> {matchData.queueId}
          </p>
          <p>
            <strong>Ranked:</strong> {matchData.ranked ? "Yes" : "No"}
          </p>
          <p>
            <strong>Status:</strong> {matchData.status}
          </p>
          <p>
            <strong>Team Size:</strong> {matchData.teamSize}
          </p>
        </div>

        <div className="mb-6">
          <h2 className="mb-2 text-xl font-semibold">Maps</h2>
          <ul>
            {matchData.maps.map((map, index) => (
              <li key={index} className="mb-1">
                {map.mapName}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="mb-2 text-xl font-semibold">Players</h2>
          <ul>
            {matchData.players.map((player, index) => (
              <li key={index} className="mb-1">
                {player.playerId}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
