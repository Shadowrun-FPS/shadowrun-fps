"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RespondToChallengeDialog } from "@/components/teams/respond-to-challenge-dialog";
import { toast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  MapPin,
  ArrowRight,
  Check,
  X,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";

// Define interface for scrimmage object
interface Team {
  _id: string;
  name: string;
  tag?: string;
}

interface Map {
  _id: string;
  name: string;
  image?: string;
}

interface Scrimmage {
  _id: string;
  isUserChallenger: boolean;
  challengerTeam: Team;
  challengedTeam: Team;
  userTeam: Team;
  proposedDate: string | Date;
  counterProposedDate?: string | Date;
  selectedMaps: any[];
  status: "pending" | "accepted" | "rejected" | "completed" | "counterProposal";
}

export function ScrimmagesList({ teamId }: { teamId: string }) {
  const [scrimmages, setScrimmages] = useState<Scrimmage[]>([]);
  const [maps, setMaps] = useState<Map[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedScrimmage, setSelectedScrimmage] = useState<Scrimmage | null>(
    null
  );

  useEffect(() => {
    const fetchMaps = async () => {
      try {
        const response = await fetch("/api/maps");
        if (!response.ok) {
          throw new Error("Failed to fetch maps");
        }
        const data = await response.json();
        setMaps(data);
      } catch (error) {
        console.error("Error fetching maps:", error);
        toast({
          title: "Error",
          description: "Failed to load maps",
          variant: "destructive",
        });
      }
    };

    fetchMaps();
  }, []);

  useEffect(() => {
    const fetchScrimmages = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/scrimmages?teamId=${teamId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch scrimmages");
        }
        const data = await response.json();
        setScrimmages(data);
      } catch (error) {
        console.error("Error fetching scrimmages:", error);
        toast({
          title: "Error",
          description: "Failed to load scrimmages",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchScrimmages();
  }, [teamId]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge
            variant="outline"
            className="text-yellow-800 bg-yellow-100 border-yellow-200"
          >
            Pending
          </Badge>
        );
      case "accepted":
        return (
          <Badge
            variant="outline"
            className="text-green-800 bg-green-100 border-green-200"
          >
            Accepted
          </Badge>
        );
      case "rejected":
        return (
          <Badge
            variant="outline"
            className="text-red-800 bg-red-100 border-red-200"
          >
            Rejected
          </Badge>
        );
      case "completed":
        return (
          <Badge
            variant="outline"
            className="text-blue-800 bg-blue-100 border-blue-200"
          >
            Completed
          </Badge>
        );
      case "counterProposal":
        return (
          <Badge
            variant="outline"
            className="text-purple-800 bg-purple-100 border-purple-200"
          >
            Counter Proposal
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const handleResponseSuccess = () => {
    // Refresh scrimmages after a response
    fetchScrimmages();
  };

  const fetchScrimmages = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/scrimmages?teamId=${teamId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch scrimmages");
      }
      const data = await response.json();
      setScrimmages(data);
    } catch (error) {
      console.error("Error fetching scrimmages:", error);
      toast({
        title: "Error",
        description: "Failed to load scrimmages",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (scrimmage: Scrimmage) => {
    setSelectedScrimmage(scrimmage);
    setDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (scrimmages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertTriangle className="w-12 h-12 mb-4 text-muted-foreground" />
        <h3 className="text-lg font-medium">No Scrimmages Found</h3>
        <p className="mt-2 text-muted-foreground">
          This team hasn&apos;t participated in any scrimmages yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Scrimmages</h2>

      <div className="grid gap-4 md:grid-cols-2">
        {scrimmages.map((scrimmage) => {
          const isChallenger = scrimmage.isUserChallenger;
          const otherTeam = isChallenger
            ? scrimmage.challengedTeam
            : scrimmage.challengerTeam;

          return (
            <Card key={scrimmage._id} className="overflow-hidden">
              <CardHeader className="pb-2 bg-muted/50">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-sm text-muted-foreground">
                      {isChallenger ? "You challenged" : "Challenge from"}
                    </span>
                    <CardTitle className="text-lg">{otherTeam.name}</CardTitle>
                  </div>
                  {getStatusBadge(scrimmage.status)}
                </div>
              </CardHeader>

              <CardContent className="pt-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span className="text-sm">
                      {format(new Date(scrimmage.proposedDate), "PPP")}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    <span className="text-sm">
                      {format(new Date(scrimmage.proposedDate), "h:mm a")}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span className="text-sm">
                      {scrimmage.selectedMaps.length} maps selected
                    </span>
                  </div>

                  {scrimmage.status === "pending" && !isChallenger && (
                    <Button
                      onClick={() => handleOpenDialog(scrimmage)}
                      className="w-full"
                    >
                      Respond to Challenge
                    </Button>
                  )}

                  {scrimmage.status === "counterProposal" && isChallenger && (
                    <div className="p-2 border rounded-md bg-muted/50">
                      <p className="text-sm font-medium">Counter Proposal:</p>
                      <p className="text-xs text-muted-foreground">
                        {format(
                          new Date(scrimmage.counterProposedDate!),
                          "PPP 'at' h:mm a"
                        )}
                      </p>
                      <div className="flex gap-2 mt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => console.log("Accept counter")}
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => console.log("Reject counter")}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {selectedScrimmage && (
        <RespondToChallengeDialog
          scrimmage={selectedScrimmage}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onResponseSuccess={handleResponseSuccess}
          userTeam={selectedScrimmage.userTeam}
          challengerTeam={selectedScrimmage.challengerTeam}
          challengedTeam={selectedScrimmage.challengedTeam}
          maps={maps}
        />
      )}
    </div>
  );
}
