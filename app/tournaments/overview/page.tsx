"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "lucide-react";
import { Header } from "@/components/header";
import { FeatureGate } from "@/components/feature-gate";

export default function TournamentsPage() {
  const [showCreateForm, setShowCreateForm] = useState(false);

  const mockTournaments = [
    {
      id: "1",
      name: "Summer Championship 2024",
      type: "4v4",
      startDate: "2024-07-01",
      prizePool: "$1,000",
      teams: 16,
      status: "Registration Open",
    },
    {
      id: "2",
      name: "Winter Classic 2024",
      type: "4v4",
      startDate: "2024-12-15",
      prizePool: "$2,000",
      teams: 32,
      status: "Coming Soon",
    },
  ];

  return (
    <FeatureGate feature="tournaments">
      <div className="min-h-screen">
        <Header />
        <main className="container px-4 py-8 mx-auto">
          <h1 className="mb-6 text-3xl font-bold">Tournaments Overview</h1>
          <div className="flex items-center justify-between mb-4">
            <Button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Create Tournament
            </Button>
          </div>

          {showCreateForm && (
            <Card className="bg-[#111827] border-[#2d3748] text-white">
              <CardHeader>
                <CardTitle>Create Tournament</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm">Tournament Name</label>
                    <Input
                      className="bg-[#1a2234] border-[#2d3748]"
                      placeholder="Enter tournament name"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm">Tournament Type</label>
                    <Select>
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
                      />
                      <Calendar className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm">Prize Pool</label>
                    <Input
                      className="bg-[#1a2234] border-[#2d3748]"
                      placeholder="Enter prize pool amount"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm">Maximum Teams</label>
                    <Input
                      type="number"
                      className="bg-[#1a2234] border-[#2d3748]"
                      placeholder="Enter max teams"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm">Registration Deadline</label>
                    <div className="relative">
                      <Input
                        type="date"
                        className="bg-[#1a2234] border-[#2d3748]"
                      />
                      <Calendar className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                </div>

                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  Create Tournament
                </Button>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {mockTournaments.map((tournament) => (
              <Card
                key={tournament.id}
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
                      <p>{tournament.startDate}</p>
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
        </main>
      </div>
    </FeatureGate>
  );
}
