"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Shield,
  Users,
  Trophy,
  TrendingUp,
  Settings,
  Mail,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TeamSettingsForm } from "@/components/teams/team-settings-form";
import { TransferCaptainForm } from "@/components/teams/transfer-captain-form";
import { TeamInvites } from "@/components/teams/team-invites";

interface TeamMember {
  discordId: string;
  discordNickname: string;
  role: string;
}

interface Team {
  _id: string;
  name: string;
  tag: string;
  description: string;
  captain: {
    discordId: string;
    discordNickname: string;
  };
  members: TeamMember[];
  teamElo: number;
}

export default function TeamPage({ params }: { params: { teamId: string } }) {
  const { data: session } = useSession();
  const [team, setTeam] = useState<Team | null>(null);
  const isTeamCaptain = session?.user?.id === team?.captain.discordId;

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const response = await fetch(`/api/teams/${params.teamId}`);
        const data = await response.json();
        setTeam(data);
      } catch (error) {
        console.error("Failed to fetch team:", error);
      }
    };

    fetchTeam();
  }, [params.teamId]);

  if (!team) return null;

  const getRoleBadgeStyle = (role: string) => {
    switch (role.toLowerCase()) {
      case "captain":
        return "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20";
      case "member":
        return "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20";
      case "substitute":
        return "bg-gray-500/10 text-gray-500 hover:bg-gray-500/20";
      default:
        return "bg-primary/10 text-primary hover:bg-primary/20";
    }
  };

  return (
    <div className="min-h-screen">
      <main className="container px-4 py-8 mx-auto space-y-6">
        {/* First Row: Team Details and Members */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Team Details Card */}
          <Card className="md:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-2xl font-bold">
                    Team Details
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Information about {team.name}
                  </p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <span className="text-xl font-bold">
                    {team.teamElo.toLocaleString()}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {isTeamCaptain ? (
                <TeamSettingsForm team={team} />
              ) : (
                <>
                  <div>
                    <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                      Team Name
                    </h3>
                    <p className="text-xl font-semibold">{team.name}</p>
                  </div>

                  <div>
                    <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                      Team Tag
                    </h3>
                    <Badge variant="secondary" className="text-lg">
                      [{team.tag}]
                    </Badge>
                  </div>

                  <div>
                    <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                      Description
                    </h3>
                    <p className="text-muted-foreground">{team.description}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Team Members Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Team Members
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Captain Section */}
                <div>
                  <h3 className="flex items-center gap-2 mb-3 text-sm font-medium text-muted-foreground">
                    <Shield className="w-4 h-4" />
                    Captain
                  </h3>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <span className="font-medium">
                      {team.captain.discordNickname}
                    </span>
                    <Badge className={getRoleBadgeStyle("captain")}>
                      Captain
                    </Badge>
                  </div>
                </div>

                {/* Members Section */}
                <div>
                  <h3 className="flex items-center gap-2 mb-3 text-sm font-medium text-muted-foreground">
                    <Users className="w-4 h-4" />
                    Active Members
                  </h3>
                  <div className="space-y-2">
                    {team.members
                      .filter((member) => member.role === "member")
                      .map((member) => (
                        <div
                          key={member.discordId}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                        >
                          <span className="font-medium">
                            {member.discordNickname}
                          </span>
                          <Badge className={getRoleBadgeStyle(member.role)}>
                            {member.role}
                          </Badge>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Substitutes Section */}
                {team.members.some(
                  (member) => member.role === "substitute"
                ) && (
                  <div>
                    <h3 className="flex items-center gap-2 mb-3 text-sm font-medium text-muted-foreground">
                      <Users className="w-4 h-4" />
                      Substitutes
                    </h3>
                    <div className="space-y-2">
                      {team.members
                        .filter((member) => member.role === "substitute")
                        .map((member) => (
                          <div
                            key={member.discordId}
                            className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                          >
                            <span className="font-medium">
                              {member.discordNickname}
                            </span>
                            <Badge className={getRoleBadgeStyle(member.role)}>
                              {member.role}
                            </Badge>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Captain Settings Section (Middle Row) */}
        {isTeamCaptain && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="md:col-span-2 lg:col-span-3">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Captain Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TransferCaptainForm team={team} />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Recent Invites Section (Bottom Row) */}
        {isTeamCaptain && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="md:col-span-2 lg:col-span-3">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Recent Invites
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TeamInvites teamId={team._id} />
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
