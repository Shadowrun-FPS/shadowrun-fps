"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { FeatureGate } from "@/components/feature-gate";
// TODO SIN: Remove all unused imports! Can use eslint for this.
interface Queue {
  _id: string;
  name: string;
  type: string;
  players: string[];
  status: "active" | "inactive";
  createdAt: Date;
}

type TabType = "pending" | "upcoming" | "completed";

export default function ScrimmagesPage() {
  const [activeTab, setActiveTab] = useState<TabType>("pending");

  const tabContent = {
    pending: {
      title: "No pending scrimmages",
      description: "Challenge a team to start a scrimmage",
    },
    upcoming: {
      title: "No upcoming scrimmages",
      description: "Scheduled scrimmages will appear here",
    },
    completed: {
      title: "No completed scrimmages",
      description: "Your match history will appear here",
    },
  };

  return (
    <FeatureGate feature="scrimmage">
      <div className="min-h-screen">
        <main className="container px-4 py-8 mx-auto">
          <h1 className="mb-6 text-2xl font-bold">Scrimmages</h1>

          <div className="space-y-6">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab("pending")}
                className={cn(
                  "px-4 py-2 rounded-md transition-colors",
                  activeTab === "pending"
                    ? "bg-muted/50 font-medium"
                    : "text-muted-foreground hover:bg-muted/30"
                )}
              >
                Pending
              </button>
              <button
                onClick={() => setActiveTab("upcoming")}
                className={cn(
                  "px-4 py-2 rounded-md transition-colors",
                  activeTab === "upcoming"
                    ? "bg-muted/50 font-medium"
                    : "text-muted-foreground hover:bg-muted/30"
                )}
              >
                Upcoming
              </button>
              <button
                onClick={() => setActiveTab("completed")}
                className={cn(
                  "px-4 py-2 rounded-md transition-colors",
                  activeTab === "completed"
                    ? "bg-muted/50 font-medium"
                    : "text-muted-foreground hover:bg-muted/30"
                )}
              >
                Completed
              </button>
            </div>

            <div className="rounded-lg border border-border bg-card min-h-[200px] flex items-center justify-center flex-col gap-2">
              <p className="text-muted-foreground">
                {tabContent[activeTab].title}
              </p>
              <p className="text-sm text-muted-foreground">
                {tabContent[activeTab].description}
              </p>
            </div>
          </div>
        </main>
      </div>
    </FeatureGate>
  );
}
