import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { getTeamForPage } from "@/lib/team-fetch";
import TeamPageClient from "./team-page-client";

interface PageProps {
  params: Promise<{ teamId: string }>;
}

export default async function TeamPage({ params }: PageProps) {
  const { teamId } = await params;
  const team = await getTeamForPage(teamId);

  if (!team) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="mx-4 max-w-md rounded-xl border-2 border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
          <h2 className="mb-2 text-xl font-bold">Team not found</h2>
          <p className="mb-6 text-sm text-muted-foreground">
            The team may have been deleted or the link is invalid.
          </p>
          <Button asChild>
            <Link href="/tournaments/teams">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to teams
            </Link>
                </Button>
              </div>
      </div>
    );
  }

  return <TeamPageClient initialTeam={team} teamId={teamId} />;
}
