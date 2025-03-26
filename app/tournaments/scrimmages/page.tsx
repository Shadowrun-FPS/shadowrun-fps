"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Calendar, Clock, MapPin, Loader2, Trophy } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import Link from "next/link";

interface MapSelection {
  id: string;
  name: string;
  isSmallVariant: boolean;
  image?: string;
}

interface Scrimmage {
  _id: string;
  challengerTeam: {
    _id: string;
    name: string;
    tag: string;
  };
  challengedTeam: {
    _id: string;
    name: string;
    tag: string;
  };
  challengerCaptain: {
    discordId: string;
    discordUsername: string;
    discordNickname: string;
    discordProfilePicture: string;
  };
  proposedDate: string;
  selectedMaps: MapSelection[];
  mapDetails?: any[];
  message?: string;
  status: "pending" | "accepted" | "rejected" | "completed" | "cancelled";
  createdAt: string;
  scrimmageId?: string;
  winner?: string;
}

export default function ScrimmagesPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState("pending");
  const [scrimmages, setScrimmages] = useState<Scrimmage[]>([]);
  const [loading, setLoading] = useState(true);
  const [userTeam, setUserTeam] = useState<any>(null);

  useEffect(() => {
    const fetchScrimmages = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/scrimmages");
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

    const fetchUserTeam = async () => {
      if (session?.user) {
        try {
          const response = await fetch("/api/teams/user-team");
          if (response.ok) {
            const data = await response.json();
            setUserTeam(data.team);
          }
        } catch (error) {
          console.error("Error fetching user team:", error);
        }
      }
    };

    fetchScrimmages();
    fetchUserTeam();
  }, [session]);

  // Filter scrimmages based on status
  const pendingScrimmages = scrimmages.filter(
    (scrimmage) => scrimmage.status === "pending"
  );
  const upcomingScrimmages = scrimmages.filter(
    (scrimmage) => scrimmage.status === "accepted"
  );
  const completedScrimmages = scrimmages.filter(
    (scrimmage) => scrimmage.status === "completed"
  );

  // Check if user is a team captain
  const isTeamCaptain =
    userTeam && session?.user?.id === userTeam.captain?.discordId;

  // Handle accepting a challenge
  const handleAcceptChallenge = async (scrimmageId: string) => {
    try {
      const response = await fetch(`/api/scrimmages/${scrimmageId}/accept`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to accept challenge");
      }

      // Update the scrimmage status locally and add the scrimmageId
      const updatedScrimmage = await response.json();
      setScrimmages((prev) =>
        prev.map((s) =>
          s._id === scrimmageId
            ? {
                ...s,
                status: "accepted",
                scrimmageId: updatedScrimmage.scrimmageId,
              }
            : s
        )
      );

      // Switch to the Upcoming tab
      setActiveTab("upcoming");

      toast({
        title: "Challenge accepted",
        description: "The scrimmage has been scheduled.",
      });
    } catch (error: any) {
      console.error("Error accepting challenge:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to accept challenge",
        variant: "destructive",
      });
    }
  };

  // Handle rejecting a challenge
  const handleRejectChallenge = async (scrimmageId: string) => {
    try {
      const response = await fetch(`/api/scrimmages/${scrimmageId}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to reject challenge");
      }

      // Remove the rejected scrimmage from the list
      setScrimmages((prev) => prev.filter((s) => s._id !== scrimmageId));

      toast({
        title: "Challenge rejected",
        description: "The scrimmage challenge has been rejected.",
      });
    } catch (error: any) {
      console.error("Error rejecting challenge:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to reject challenge",
        variant: "destructive",
      });
    }
  };

  const handleCancelChallenge = async (scrimmageId: string) => {
    try {
      const response = await fetch(`/api/scrimmages/${scrimmageId}/cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to cancel challenge");
      }

      // Remove the cancelled scrimmage from the list or update its status
      setScrimmages((prev) =>
        prev.map((s) =>
          s._id === scrimmageId ? { ...s, status: "cancelled" } : s
        )
      );

      toast({
        title: "Challenge cancelled",
        description: "The scrimmage challenge has been cancelled.",
      });
    } catch (error: any) {
      console.error("Error cancelling challenge:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to cancel challenge",
        variant: "destructive",
      });
    }
  };

  function filterBadWords(message: string): string {
    if (!message) return "";

    const badWords = [
      "fuck",
      "shit",
      "ass",
      "bitch",
      "cunt",
      "dick",
      "pussy",
      "cock",
      "nigger",
      "faggot",
    ];

    let filteredMessage = message;
    badWords.forEach((word) => {
      const regex = new RegExp(`\\b${word}\\b`, "gi");
      filteredMessage = filteredMessage.replace(regex, "*".repeat(word.length));
    });

    return filteredMessage;
  }

  const CompletedScrimmages = ({ scrimmages }: { scrimmages: any[] }) => {
    return (
      <div className="space-y-4">
        {scrimmages.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No completed scrimmages found
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {scrimmages.map((scrimmage) => {
              const winnerTeam =
                scrimmage.winner === "teamA"
                  ? scrimmage.challengerTeam
                  : scrimmage.winner === "teamB"
                  ? scrimmage.challengedTeam
                  : null;

              return (
                <Card key={scrimmage._id} className="overflow-hidden">
                  <CardHeader className="p-4 pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg">
                        {scrimmage.challengerTeam?.name} vs{" "}
                        {scrimmage.challengedTeam?.name}
                      </CardTitle>
                      <Badge
                        variant={
                          scrimmage.status === "completed"
                            ? "default"
                            : "outline"
                        }
                      >
                        {scrimmage.status === "completed"
                          ? "Completed"
                          : scrimmage.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-2 pb-0">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span>
                          {format(
                            new Date(scrimmage.proposedDate),
                            "MMMM d, yyyy"
                          )}
                        </span>
                      </div>
                      {winnerTeam && (
                        <div className="flex items-center gap-2 text-sm text-green-500">
                          <Trophy className="w-4 h-4" />
                          <span>{winnerTeam.name} won</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="p-4 flex justify-end">
                    <Button variant="outline" size="sm" asChild>
                      <Link
                        href={`/tournaments/scrimmages/${
                          scrimmage.scrimmageId || scrimmage._id
                        }`}
                      >
                        View Match
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="container px-4 py-8 mx-auto">
      <h1 className="text-3xl font-bold">Scrimmages</h1>
      <p className="mt-2 text-muted-foreground">
        View and manage scrimmage matches between teams
      </p>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
        <TabsList>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : pendingScrimmages.length === 0 ? (
            <div className="p-12 text-center border rounded-lg">
              <h3 className="text-lg font-medium">No pending challenges</h3>
              <p className="mt-2 text-muted-foreground">
                Challenge a team to start a scrimmage.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {pendingScrimmages.map((scrimmage) => (
                <Card
                  key={scrimmage._id}
                  className="overflow-hidden border-l-4 border-l-primary"
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-bold">
                        {scrimmage.challengerTeam.name} vs{" "}
                        {scrimmage.challengedTeam.name}
                      </CardTitle>
                      <Badge variant="outline" className="font-medium">
                        Pending
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-primary" />
                        <span className="text-sm">
                          {format(
                            new Date(scrimmage.proposedDate),
                            "EEEE, MMMM d"
                          )}{" "}
                          • {format(new Date(scrimmage.proposedDate), "h:mm a")}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {scrimmage.selectedMaps &&
                        scrimmage.selectedMaps.length > 0 ? (
                          scrimmage.selectedMaps.map((map, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="text-xs"
                            >
                              {map.name}
                            </Badge>
                          ))
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            No maps selected
                          </Badge>
                        )}
                      </div>

                      {scrimmage.message && (
                        <div className="p-3 text-sm italic border-l-2 rounded-md bg-muted border-primary">
                          <div className="mb-1 text-xs font-semibold text-muted-foreground">
                            Message from {scrimmage.challengerTeam.name}
                          </div>
                          &quot;{filterBadWords(scrimmage.message)}&quot;
                        </div>
                      )}

                      {isTeamCaptain && (
                        <div className="flex gap-2 mt-4">
                          {userTeam._id === scrimmage.challengedTeam._id ? (
                            <>
                              <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() =>
                                  handleRejectChallenge(scrimmage._id)
                                }
                              >
                                Decline
                              </Button>
                              <Button
                                className="flex-1"
                                onClick={() =>
                                  handleAcceptChallenge(scrimmage._id)
                                }
                              >
                                Accept
                              </Button>
                            </>
                          ) : (
                            userTeam._id === scrimmage.challengerTeam._id && (
                              <Button
                                variant="destructive"
                                className="w-full"
                                onClick={() =>
                                  handleCancelChallenge(scrimmage._id)
                                }
                              >
                                Cancel Challenge
                              </Button>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="upcoming" className="mt-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : upcomingScrimmages.length === 0 ? (
            <div className="p-12 text-center border rounded-lg">
              <h3 className="text-lg font-medium">No upcoming scrimmages</h3>
              <p className="mt-2 text-muted-foreground">
                Accept a challenge to see it here.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {upcomingScrimmages.map((scrimmage) => (
                <Card key={scrimmage._id} className="overflow-hidden">
                  <CardHeader className="p-4 bg-muted/50">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">Upcoming</Badge>
                      <span className="text-sm text-muted-foreground">
                        {format(
                          new Date(scrimmage.proposedDate),
                          "MMM dd, yyyy"
                        )}
                      </span>
                    </div>
                    <CardTitle className="mt-2 text-lg">
                      {scrimmage.challengerTeam.name} vs{" "}
                      {scrimmage.challengedTeam.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="flex items-center mb-3">
                      <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                      <span>
                        {format(
                          new Date(scrimmage.proposedDate),
                          "MMMM dd, yyyy"
                        )}
                      </span>
                    </div>
                    <div className="flex items-center mb-3">
                      <Clock className="w-4 h-4 mr-2 text-muted-foreground" />
                      <span>
                        {format(new Date(scrimmage.proposedDate), "h:mm a")}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-2 text-muted-foreground" />
                      <span>Maps:</span>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {scrimmage.selectedMaps &&
                      scrimmage.selectedMaps.length > 0 ? (
                        scrimmage.selectedMaps.map((map, index) => (
                          <Badge key={index} variant="secondary">
                            {map.name}
                          </Badge>
                        ))
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          No maps selected
                        </Badge>
                      )}
                    </div>

                    {scrimmage.status === "accepted" && (
                      <div className="mt-4">
                        <Button
                          variant="default"
                          size="sm"
                          asChild
                          className="w-full"
                        >
                          <Link
                            href={`/tournaments/scrimmages/${
                              scrimmage.scrimmageId || scrimmage._id
                            }`}
                          >
                            View Match
                          </Link>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="mt-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : completedScrimmages.length === 0 ? (
            <div className="p-12 text-center border rounded-lg">
              <h3 className="text-lg font-medium">No completed scrimmages</h3>
              <p className="mt-2 text-muted-foreground">
                Complete a scrimmage to see it here.
              </p>
            </div>
          ) : (
            <CompletedScrimmages scrimmages={completedScrimmages} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
