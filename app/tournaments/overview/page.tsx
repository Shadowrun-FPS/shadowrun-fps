"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FeatureGate } from "@/components/feature-gate";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface Tournament {
  _id: string;
  name: string;
  type: string;
  startDate: string;
  prizePool: string;
  teams: number;
  status: string;
}

export default function TournamentsPage() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Form state
  const [tournamentName, setTournamentName] = useState("");
  const [tournamentType, setTournamentType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [prizePool, setPrizePool] = useState("");
  const [maxTeams, setMaxTeams] = useState("");
  const [registrationDeadline, setRegistrationDeadline] = useState("");

  // First, memoize the fetchTournaments function with useCallback
  const fetchTournaments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/tournaments");
      if (!response.ok) {
        throw new Error("Failed to fetch tournaments");
      }
      const data = await response.json();
      setTournaments(data.tournaments || []);
    } catch (error) {
      console.error("Error fetching tournaments:", error);
      toast({
        title: "Error",
        description: "Failed to load tournaments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Then use it in the useEffect
  useEffect(() => {
    fetchTournaments();
  }, [fetchTournaments]);

  const handleCreateTournament = async () => {
    try {
      const response = await fetch("/api/tournaments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: tournamentName,
          type: tournamentType,
          startDate,
          prizePool,
          maxTeams: parseInt(maxTeams),
          registrationDeadline,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create tournament");
      }

      toast({
        title: "Success",
        description: "Tournament created successfully",
      });

      // Reset form and close dialog
      resetForm();
      setShowCreateDialog(false);

      // Refresh tournaments list
      fetchTournaments();
    } catch (error) {
      console.error("Error creating tournament:", error);
      toast({
        title: "Error",
        description: "Failed to create tournament",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setTournamentName("");
    setTournamentType("");
    setStartDate("");
    setPrizePool("");
    setMaxTeams("");
    setRegistrationDeadline("");
  };

  return (
    <FeatureGate feature="tournaments">
      <div className="min-h-screen">
        <main className="container px-4 py-8 mx-auto">
          <h1 className="mb-6 text-3xl font-bold">Tournaments Overview</h1>
          <div className="flex items-center justify-between mb-4">
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Create Tournament
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-8">Loading tournaments...</div>
          ) : tournaments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No tournaments found. Create one to get started!
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {tournaments.map((tournament) => (
                <Card
                  key={tournament._id}
                  className="bg-[#111827] border-[#2d3748] text-white"
                >
                  <CardHeader>
                    <CardTitle>{tournament.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-400">Type</p>
                        <p>{tournament.type}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Start Date</p>
                        <p>
                          {new Date(tournament.startDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Prize Pool</p>
                        <p>{tournament.prizePool}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Teams</p>
                        <p>{tournament.teams}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-green-400">
                        {tournament.status}
                      </span>
                      <Button className="bg-blue-600 hover:bg-blue-700">
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Create Tournament Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="bg-[#111827] border-[#2d3748] text-white">
          <DialogHeader>
            <DialogTitle>Create Tournament</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm">Tournament Name</label>
              <Input
                className="bg-[#1a2234] border-[#2d3748]"
                placeholder="Enter tournament name"
                value={tournamentName}
                onChange={(e) => setTournamentName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm">Tournament Type</label>
              <Select value={tournamentType} onValueChange={setTournamentType}>
                <SelectTrigger className="bg-[#1a2234] border-[#2d3748]">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="4v4">4v4</SelectItem>
                  <SelectItem value="5v5">5v5</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm">Start Date</label>
              <div className="relative">
                <Input
                  type="date"
                  className="bg-[#1a2234] border-[#2d3748]"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <Calendar className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm">Prize Pool</label>
              <Input
                className="bg-[#1a2234] border-[#2d3748]"
                placeholder="Enter prize pool amount"
                value={prizePool}
                onChange={(e) => setPrizePool(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm">Maximum Teams</label>
              <Input
                type="number"
                className="bg-[#1a2234] border-[#2d3748]"
                placeholder="Enter max teams"
                value={maxTeams}
                onChange={(e) => setMaxTeams(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm">Registration Deadline</label>
              <div className="relative">
                <Input
                  type="date"
                  className="bg-[#1a2234] border-[#2d3748]"
                  value={registrationDeadline}
                  onChange={(e) => setRegistrationDeadline(e.target.value)}
                />
                <Calendar className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={handleCreateTournament}
            >
              Create Tournament
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </FeatureGate>
  );
}
