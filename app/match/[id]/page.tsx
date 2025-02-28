"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { useMatchStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import Image from "next/image";

export default function MatchPage() {
  const params = useParams();
  const { matches, updateMapScore } = useMatchStore();
  const { toast } = useToast();
  const [match, setMatch] = useState<any>(null);
  const [scores, setScores] = useState<{
    [key: string]: { teamA: number; teamB: number };
  }>({});

  // Move mockMatch inside useEffect or use useMemo
  const mockMatch = useMemo(
    () => ({
      id: "a5f0aa32-4e03-4fa8-afa8-c00b7b99f786",
      status: "queue",
      type: "ranked",
      eloTier: "medium",
      teamSize: "4",
      createdBy: "grimz",
      date: new Date().toISOString(),
      teams: {
        teamA: [
          { id: "1", name: "BumJamas", avatar: "👨‍🚀" },
          { id: "2", name: "Niddlez", avatar: "🧙‍♂️" },
          { id: "3", name: "Skeebum", avatar: "🦹‍♂️" },
          { id: "4", name: "Sinful Hollowz", avatar: "🧝‍♂️" },
        ],
        teamB: [
          { id: "5", name: "VertigoSR", avatar: "🧙‍♀️" },
          { id: "6", name: "ManaMyxtery", avatar: "🦹‍♀️" },
          { id: "7", name: "Shadowrun Girl", avatar: "🧝‍♀️" },
          { id: "8", name: "TrooperSuper12", avatar: "👩‍🚀" },
        ],
      },
      maps: [
        { name: "Lobby", teamAScore: 3, teamBScore: 4, reported: false },
        { name: "Nerve Center", teamAScore: 4, teamBScore: 4, reported: false },
        {
          name: "Power Station",
          teamAScore: 0,
          teamBScore: 0,
          reported: false,
        },
      ],
    }),
    []
  ); // Empty deps since it's static data

  useEffect(() => {
    setMatch(mockMatch);
    if (mockMatch.maps) {
      const initialScores = mockMatch.maps.reduce((acc, map) => {
        acc[map.name] = { teamA: map.teamAScore, teamB: map.teamBScore };
        return acc;
      }, {} as { [key: string]: { teamA: number; teamB: number } });
      setScores(initialScores);
    }
  }, [mockMatch]);

  const handleScoreSubmit = (mapIndex: number, mapName: string) => {
    if (!match) return;

    updateMapScore(
      match.id,
      mapIndex,
      scores[mapName].teamA,
      scores[mapName].teamB,
      "A"
    );

    toast({
      title: "Scores Submitted",
      description: `Scores for ${mapName} have been submitted.`,
      variant: "default",
    });
  };

  if (!match) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-[#0a0e17] text-white p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold">View Match Details</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Match Info Card */}
          <Card className="bg-[#0d1117] border-[#1f2937] text-white">
            <CardHeader>
              <CardTitle>Quads Mid Queue</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="text-gray-400">Match ID: {match.id}</p>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Type:</span>
                  <span>{match.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Status:</span>
                  <span>{match.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">ELO Tier:</span>
                  <span>{match.eloTier}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Team Size:</span>
                  <span>{match.teamSize}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Created By:</span>
                  <span>{match.createdBy}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Anonymous:</span>
                  <span>false</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Players Card */}
          <Card className="bg-[#0d1117] border-[#1f2937] text-white">
            <CardHeader>
              <CardTitle>Players</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {match.teams.teamA.map((player: any) => (
                  <div key={player.id} className="flex items-center gap-2">
                    <span className="text-xl">{player.avatar}</span>
                    <span className="text-sm">{player.name}</span>
                  </div>
                ))}
                {match.teams.teamB.map((player: any) => (
                  <div key={player.id} className="flex items-center gap-2">
                    <span className="text-xl">{player.avatar}</span>
                    <span className="text-sm">{player.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Match Results Card */}
          <Card className="bg-[#0d1117] border-[#1f2937] text-white">
            <CardHeader>
              <CardTitle>Match Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {match.maps.map((map: any, index: number) => (
                <div key={map.name} className="space-y-2">
                  <h3 className="font-medium">Map: {index + 1}</h3>
                  <p className="text-sm text-gray-400">Scored By: grimz</p>
                  <div className="space-y-1 text-sm">
                    <p>Team 1: RNA {map.teamAScore} rounds.</p>
                    <p>Team 2: Lineage {map.teamBScore} rounds.</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Maps Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {match.maps.map((map: any, index: number) => (
            <Card
              key={map.name}
              className="bg-[#0d1117] border-[#1f2937] text-white"
            >
              <CardHeader>
                <CardTitle>Map {index + 1}</CardTitle>
                <h3 className="text-xl">{map.name}</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative h-48 w-full overflow-hidden rounded-lg">
                  <Image
                    src={`https://hebbkx1anhila5yf.public.blob.vercel-storage.com/match%20page-7O2EpLXPqL5HfOLYZM91MF0WChLPvx.png`}
                    alt={map.name}
                    fill
                    className="object-cover"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm mb-1">Team RNA</label>
                    <Input
                      type="number"
                      value={scores[map.name]?.teamA || 0}
                      onChange={(e) =>
                        setScores((prev) => ({
                          ...prev,
                          [map.name]: {
                            ...prev[map.name],
                            teamA: Number.parseInt(e.target.value),
                          },
                        }))
                      }
                      className="bg-[#1a2234] border-[#2d3748]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Team Lineage</label>
                    <Input
                      type="number"
                      value={scores[map.name]?.teamB || 0}
                      onChange={(e) =>
                        setScores((prev) => ({
                          ...prev,
                          [map.name]: {
                            ...prev[map.name],
                            teamB: Number.parseInt(e.target.value),
                          },
                        }))
                      }
                      className="bg-[#1a2234] border-[#2d3748]"
                    />
                  </div>
                </div>

                <Button
                  onClick={() => handleScoreSubmit(index, map.name)}
                  className="w-full bg-white text-black hover:bg-gray-200"
                >
                  Submit Scores
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
