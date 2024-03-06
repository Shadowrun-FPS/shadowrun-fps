import { Metadata } from "next";
import { getMatchDetails } from "@/lib/match-helpers";
import ReadyButton from "./ready-button";
import PlayerItem from "@/components/player/player-item";
import { CheckCircle, CircleSlash } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
  title: "Match Ready Check!",
};

export default async function ReadyCheckPage({
  params,
}: {
  params: { matchId: string };
}) {
  const matchId = params.matchId;
  const match = await getMatchDetails(matchId);
  if (!match) {
    return <div>No match found with id: {matchId}</div>;
  }
  const players = match?.players;

  return (
    <div className="container grid gap-4">
      <h1 className="text-5xl font-bold">Ready Check</h1>
      <div className="grid gap-16 md:grid-cols-2">
        <ReadyButton />
        <div>
          <h2 className="text-3xl font-bold">Players</h2>
          {players.map((player, index) => (
            <div key={player.discordId} className="grid">
              <div className="flex items-center gap-4 p-2">
                <div className="grow">
                  <PlayerItem
                    discordId={player.discordId}
                    matchTeamSize={match.teamSize}
                  />
                </div>
                <p>{player.isReady ? <CheckCircle /> : <CircleSlash />}</p>
              </div>
              {index !== players.length - 1 && <Separator />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
