"use client";
import PlayerItem from "@/components/player/player-item";
import ReadyButton from "./ready-button";
import { Separator } from "@radix-ui/react-dropdown-menu";
import { CheckCircle, CircleSlash } from "lucide-react";
import { Match } from "@/types/types";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import PlayerItemSkeleton from "@/components/skeleton/PlayerItemSkeleton";

export function ReadyContent({ matchId }: { matchId: string }) {
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    fetch(`/api/matches/?matchId=${matchId}`)
      .then((res) => res.json())
      .then((data) => setMatch(data.result))
      .then(() => setLoading(false))
      .catch((error) => {
        console.error("Error fetching match: ", error);
        setLoading(false);
      });
  }, [matchId]);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <h2 className="text-3xl font-bold">Players</h2>
        {[...Array(4)].map((_, index) => (
          <div key={index} className="grid">
            <div className="flex items-center gap-4 p-2">
              <PlayerItemSkeleton />
            </div>
          </div>
        ))}
      </div>
    );
  } else if (!match) {
    return <div>Could not find match</div>;
  } else {
    return (
      <div className="grid gap-16 md:grid-cols-2">
        <ReadyButton matchId={match.matchId} players={match.players} />
        <div>
          <h2 className="text-3xl font-bold">Players</h2>
          {match?.players.map((player, index) => (
            <div key={player.discordId} className="grid">
              <div className="flex items-center gap-4 p-2">
                <div className="grow">
                  <PlayerItem
                    discordId={player.discordId}
                    matchTeamSize={match.teamSize}
                  />
                </div>
                <p>
                  {player.isReady ? (
                    <CheckCircle color="#10B981" />
                  ) : (
                    <CircleSlash color="#EF4444" />
                  )}
                </p>
              </div>
              {index !== match.players.length - 1 && <Separator />}
            </div>
          ))}
        </div>
      </div>
    );
  }
}
