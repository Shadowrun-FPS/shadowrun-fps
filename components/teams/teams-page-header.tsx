"use client";

import { Search, Shield } from "lucide-react";
import { Input } from "@/components/ui/input";
import { CreateTeamForm } from "@/components/teams/create-team-form";

type TeamsPageHeaderProps = {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onCreateSuccess?: () => void;
};

export function TeamsPageHeader({
  searchQuery,
  onSearchChange,
  onCreateSuccess,
}: TeamsPageHeaderProps) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:mb-10 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-3">
        <div className="relative shrink-0 rounded-xl border-2 border-primary/30 bg-gradient-to-br from-primary/20 to-primary/10 p-2.5 shadow-lg shadow-primary/10">
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/40 to-transparent opacity-50" />
          <Shield className="relative h-6 w-6 text-primary drop-shadow-sm sm:h-7 sm:w-7" aria-hidden />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
            Teams
          </h1>
          <p className="mt-1 text-sm text-foreground/70 sm:text-base">
            Browse and manage competitive teams
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative">
          <Search
            className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="search"
            placeholder="Search teams..."
            className="w-full pl-9 sm:w-[260px]"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Search teams by name, tag, or captain"
          />
        </div>
        <CreateTeamForm onSuccess={onCreateSuccess} />
      </div>
    </div>
  );
}
