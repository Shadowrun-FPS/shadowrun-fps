"use client";

import { Star } from "lucide-react";
import { CreateTeamForm } from "@/components/teams/create-team-form";
import { TeamsPageSectionHeading } from "@/components/teams/teams-page-section-heading";
import { Separator } from "@/components/ui/separator";

type MyTeamsEmptySectionProps = {
  onCreateSuccess: () => void;
};

export function MyTeamsEmptySection({ onCreateSuccess }: MyTeamsEmptySectionProps) {
  return (
    <>
      <div className="mb-8 mt-8 sm:mb-10 sm:mt-12">
        <TeamsPageSectionHeading
          icon={Star}
          title="My Teams"
          description="Create a team or ask a captain for an invite"
          className="mb-4 sm:mb-6"
        />
        <p className="mb-4 max-w-lg text-sm text-muted-foreground">
          You are not on any team yet. Create one to register for tournaments and scrimmages.
        </p>
        <CreateTeamForm onSuccess={onCreateSuccess} />
      </div>
      <Separator className="my-8" />
    </>
  );
}
