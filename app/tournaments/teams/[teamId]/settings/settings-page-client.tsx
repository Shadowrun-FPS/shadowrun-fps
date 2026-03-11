"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Settings } from "lucide-react";
import { TeamSettingsPanel } from "@/components/teams/team-settings-panel";
import type { Team } from "@/types";

interface SettingsPageClientProps {
  initialTeam: Team;
  teamId: string;
}

export function SettingsPageClient({
  initialTeam,
  teamId,
}: SettingsPageClientProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 lg:px-8 sm:py-8">
        <Button variant="ghost" size="sm" asChild className="mb-6">
          <Link href={`/tournaments/teams/${teamId}`} className="flex gap-2 items-center">
            <ArrowLeft className="h-4 w-4" />
            Back to team
          </Link>
        </Button>

        <div className="mb-8 flex gap-3 items-center">
          <div className="rounded-xl border border-border/50 bg-card/50 p-2.5 shadow-sm">
            <Settings className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
          </div>
          <h1 className="text-xl font-semibold text-foreground sm:text-2xl">
            Edit team details
          </h1>
        </div>

        <TeamSettingsPanel initialTeam={initialTeam} teamId={teamId} />
      </div>
    </div>
  );
}
