"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  CalendarDays,
  CheckCircle,
  ChevronDown,
  Clock,
  ListFilter,
  X,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/ui/use-toast";
import { FeatureGate } from "@/components/feature-gate";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CreateTournamentDialog } from "@/components/tournaments/create-tournament-dialog";
import { TournamentCard } from "@/components/tournaments/tournament-card";
import { TournamentsOverviewHeader } from "@/components/tournaments/tournaments-overview-header";
import { TournamentsOverviewFilters } from "@/components/tournaments/tournaments-overview-filters";
import { TournamentsOverviewEmpty } from "@/components/tournaments/tournaments-overview-empty";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { safeLog } from "@/lib/security";
import { cn } from "@/lib/utils";
import { usePusherInvalidate } from "@/hooks/usePusherInvalidate";
import {
  TOURNAMENTS_LIST_PUSHER_CHANNEL,
  TOURNAMENTS_LIST_PUSHER_EVENT,
} from "@/lib/tournament-realtime-constants";

interface Tournament {
  _id: string;
  name: string;
  description?: string;
  startDate: string;
  teamSize: number;
  format: "single_elimination" | "double_elimination";
  status: "upcoming" | "active" | "completed";
  registrationDeadline?: string;
  registeredTeams: { _id: string; name: string; tag: string }[];
  maxTeams?: number;
}

/** Parsed start time, or null if missing/invalid (treated as “date TBD”). */
function tournamentStartMs(startDate: string | undefined): number | null {
  if (!startDate) return null;
  const t = new Date(startDate).getTime();
  return Number.isNaN(t) ? null : t;
}

function OverviewLoadingShell() {
  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-screen-xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10 xl:px-12">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-14 w-14 shrink-0 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-9 w-48 sm:h-10" />
              <Skeleton className="h-4 w-72 max-w-full" />
            </div>
          </div>
          <Skeleton className="h-11 w-full rounded-full sm:w-44" />
        </div>
        <Card className="mb-8 border-2">
          <CardHeader className="space-y-2 border-b pb-4">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <Skeleton className="h-11 w-full" />
            <div className="grid gap-3 sm:grid-cols-3">
              <Skeleton className="h-11 w-full" />
              <Skeleton className="h-11 w-full" />
              <Skeleton className="h-11 w-full" />
            </div>
          </CardContent>
        </Card>
        <Skeleton className="mb-6 h-12 w-full rounded-xl" />
        <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="overflow-hidden border-2">
              <CardContent className="space-y-3 p-4 sm:p-6">
                <Skeleton className="h-6 w-28" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-10 w-full rounded-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}

function TournamentsOverviewContent() {
  const { status } = useSession();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [formatFilter, setFormatFilter] = useState("all");
  const [teamSizeFilter, setTeamSizeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [canCreateTournament, setCanCreateTournament] = useState(false);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  /** Latest ?tab= value without putting it in fetchTournaments deps (tab switches must not refetch). */
  const tabParamRef = useRef<string | null>(null);
  tabParamRef.current = tabParam;
  const { toast } = useToast();

  const fetchTournaments = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent === true;
    try {
      if (!silent) setLoading(true);
      const { deduplicatedFetch } = await import("@/lib/request-deduplication");
      const data = await deduplicatedFetch<Tournament[]>("/api/tournaments", {
        ttl: 30000,
        useCache: !silent,
        ...(silent ? { cache: "no-store" as RequestCache } : {}),
      });
      setTournaments(Array.isArray(data) ? data : []);

      if (status === "authenticated") {
        const userData = await deduplicatedFetch<{
          permissions: {
            isAdmin: boolean;
            isModerator: boolean;
            isDeveloper: boolean;
          };
        }>("/api/user/data", {
          ttl: 60000,
        });

        setCanCreateTournament(
          Boolean(
            userData.permissions?.isAdmin ||
            userData.permissions?.isModerator ||
            userData.permissions?.isDeveloper,
          ),
        );
      }

      const list = Array.isArray(data) ? data : [];
      const hasActiveTournaments = list.some((t) => t.status === "active");
      const hasUpcomingTournaments = list.some((t) => t.status === "upcoming");

      const urlTab = tabParamRef.current;
      if (urlTab && ["active", "upcoming", "completed"].includes(urlTab)) {
        setActiveTab(urlTab);
      } else if (hasActiveTournaments) {
        setActiveTab("active");
      } else if (hasUpcomingTournaments) {
        setActiveTab("upcoming");
      } else {
        setActiveTab("completed");
      }
    } catch (error) {
      safeLog.error("Tournaments overview fetch failed:", error);
      toast({
        title: "Error",
        description: "Failed to load tournaments. Please try again later.",
        variant: "destructive",
      });
    } finally {
      if (!silent) setLoading(false);
    }
  }, [toast, status]);

  usePusherInvalidate(TOURNAMENTS_LIST_PUSHER_CHANNEL, TOURNAMENTS_LIST_PUSHER_EVENT, () => {
    void fetchTournaments({ silent: true });
  });

  useEffect(() => {
    void fetchTournaments();
  }, [fetchTournaments]);

  /** Keep UI tab in sync when the URL changes (e.g. browser back/forward) without refetching. */
  useEffect(() => {
    const t = searchParams.get("tab");
    if (t && ["active", "upcoming", "completed"].includes(t)) {
      setActiveTab(t);
    }
  }, [searchParams]);

  const filteredTournaments = tournaments.filter((tournament) => {
    if (
      searchTerm &&
      !tournament.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !(
        tournament.description &&
        tournament.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    ) {
      return false;
    }
    if (formatFilter !== "all" && tournament.format !== formatFilter) {
      return false;
    }
    if (
      teamSizeFilter !== "all" &&
      tournament.teamSize !== parseInt(teamSizeFilter, 10)
    ) {
      return false;
    }
    if (statusFilter !== "all" && tournament.status !== statusFilter) {
      return false;
    }
    return true;
  });

  const nowMs = Date.now();

  /** True upcoming: workflow upcoming and start not in the past (or no fixed date yet). */
  const upcomingTournaments = filteredTournaments
    .filter((t) => {
      if (t.status !== "upcoming") return false;
      const startMs = tournamentStartMs(t.startDate);
      if (startMs === null) return true;
      return startMs >= nowMs;
    })
    .sort(
      (a, b) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
    );

  /** Still `upcoming` in DB but scheduled start has passed — needs status/date update. */
  const staleUpcomingTournaments = filteredTournaments
    .filter((t) => {
      if (t.status !== "upcoming") return false;
      const startMs = tournamentStartMs(t.startDate);
      return startMs !== null && startMs < nowMs;
    })
    .sort(
      (a, b) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
    );
  const activeTournaments = filteredTournaments
    .filter((t) => t.status === "active")
    .sort(
      (a, b) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
    );
  const completedTournaments = filteredTournaments
    .filter((t) => t.status === "completed")
    .sort(
      (a, b) =>
        new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
    );

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // Keep ?tab= in the address bar without router.push — App Router would refetch
    // the RSC payload on every tab click (dev logs show GET /tournaments/overview?tab=…).
    tabParamRef.current = value;
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", value);
      window.history.replaceState(
        null,
        "",
        `${url.pathname}${url.search}${url.hash}`,
      );
    }
  };

  const filtersActive =
    Boolean(searchTerm) ||
    formatFilter !== "all" ||
    teamSizeFilter !== "all" ||
    statusFilter !== "all";

  const clearAllFilters = () => {
    setSearchTerm("");
    setFormatFilter("all");
    setTeamSizeFilter("all");
    setStatusFilter("all");
  };

  if (!activeTab) {
    return <OverviewLoadingShell />;
  }

  const tournamentGridClass =
    "grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3";

  return (
    <FeatureGate feature="tournaments">
      <div className="min-h-screen bg-background">
        <main className="mx-auto max-w-screen-xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10 xl:px-12">
          <TournamentsOverviewHeader
            canCreateTournament={canCreateTournament}
            onCreateClick={() => setIsCreateDialogOpen(true)}
          />

          <TournamentsOverviewFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            formatFilter={formatFilter}
            onFormatChange={setFormatFilter}
            teamSizeFilter={teamSizeFilter}
            onTeamSizeChange={setTeamSizeFilter}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            onClearAll={clearAllFilters}
            showClearAll={filtersActive}
          />

          {filtersActive ? (
            <section aria-label="Filtered tournament results" className="mt-2">
              <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="relative shrink-0 rounded-lg border border-primary/30 bg-gradient-to-br from-primary/20 to-primary/10 p-2">
                    <ListFilter className="h-5 w-5 text-primary" aria-hidden />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                      Search results
                    </h2>
                    <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
                      Tournaments matching your filters
                    </p>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className="w-fit rounded-full border-border/70 px-3 py-1 text-xs font-medium sm:text-sm"
                >
                  {filteredTournaments.length}{" "}
                  {filteredTournaments.length === 1
                    ? "tournament"
                    : "tournaments"}
                </Badge>
              </div>

              {loading ? (
                <div className={tournamentGridClass}>
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Card key={i} className="overflow-hidden border-2">
                      <CardContent className="space-y-3 p-4 sm:p-6">
                        <Skeleton className="h-6 w-28" />
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-10 w-full rounded-full" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : filteredTournaments.length > 0 ? (
                <div className={tournamentGridClass}>
                  {filteredTournaments.map((tournament) => (
                    <TournamentCard
                      key={tournament._id}
                      tournament={tournament}
                    />
                  ))}
                </div>
              ) : (
                <TournamentsOverviewEmpty
                  title="No tournaments found"
                  description="Try adjusting your search or filters to find what you're looking for."
                  icon={
                    <X
                      className="h-9 w-9 text-muted-foreground sm:h-10 sm:w-10"
                      aria-hidden
                    />
                  }
                  actionLabel="Clear filters"
                  onAction={clearAllFilters}
                />
              )}
            </section>
          ) : (
            <section aria-label="Tournaments by status" className="mt-2">
              <Tabs
                value={activeTab}
                onValueChange={handleTabChange}
                className="space-y-6 sm:space-y-8"
              >
                <TabsList className="grid h-auto w-full grid-cols-3 gap-1 rounded-xl border border-border/60 bg-muted/20 p-1">
                  <TabsTrigger
                    value="active"
                    className="min-h-[44px] touch-manipulation rounded-lg py-2.5 text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm sm:py-3 sm:text-base"
                  >
                    <Clock
                      className="mr-1.5 h-4 w-4 shrink-0 sm:mr-2"
                      aria-hidden
                    />
                    <span>Active</span>
                    {activeTournaments.length > 0 ? (
                      <span className="ml-1.5 rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground sm:ml-2">
                        {activeTournaments.length}
                      </span>
                    ) : null}
                  </TabsTrigger>
                  <TabsTrigger
                    value="upcoming"
                    className="min-h-[44px] touch-manipulation rounded-lg py-2.5 text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm sm:py-3 sm:text-base"
                  >
                    <CalendarDays
                      className="mr-1.5 h-4 w-4 shrink-0 sm:mr-2"
                      aria-hidden
                    />
                    <span>Upcoming</span>
                    {upcomingTournaments.length + staleUpcomingTournaments.length >
                    0 ? (
                      <span className="ml-1.5 rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground sm:ml-2">
                        {upcomingTournaments.length +
                          staleUpcomingTournaments.length}
                      </span>
                    ) : null}
                  </TabsTrigger>
                  <TabsTrigger
                    value="completed"
                    className="min-h-[44px] touch-manipulation rounded-lg py-2.5 text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm sm:py-3 sm:text-base"
                  >
                    <CheckCircle
                      className="mr-1.5 h-4 w-4 shrink-0 sm:mr-2"
                      aria-hidden
                    />
                    <span>Completed</span>
                    {completedTournaments.length > 0 ? (
                      <span className="ml-1.5 rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground sm:ml-2">
                        {completedTournaments.length}
                      </span>
                    ) : null}
                  </TabsTrigger>
                </TabsList>

                <TabsContent
                  value="active"
                  className="mt-0 space-y-6 focus-visible:outline-none"
                >
                  {loading ? (
                    <div className={tournamentGridClass}>
                      {[1, 2, 3].map((i) => (
                        <Skeleton
                          key={i}
                          className="h-72 rounded-xl border-2"
                        />
                      ))}
                    </div>
                  ) : activeTournaments.length > 0 ? (
                    <div className={tournamentGridClass}>
                      {activeTournaments.map((tournament) => (
                        <TournamentCard
                          key={tournament._id}
                          tournament={tournament}
                        />
                      ))}
                    </div>
                  ) : (
                    <TournamentsOverviewEmpty
                      title="No active tournaments"
                      description="Nothing in progress right now. Check upcoming events or create a tournament if you have access."
                      icon={
                        <Clock
                          className="h-9 w-9 text-muted-foreground sm:h-10 sm:w-10"
                          aria-hidden
                        />
                      }
                    />
                  )}
                </TabsContent>

                <TabsContent
                  value="upcoming"
                  className="mt-0 space-y-6 focus-visible:outline-none"
                >
                  {loading ? (
                    <div className={tournamentGridClass}>
                      {[1, 2, 3].map((i) => (
                        <Skeleton
                          key={i}
                          className="h-72 rounded-xl border-2"
                        />
                      ))}
                    </div>
                  ) : upcomingTournaments.length > 0 ||
                    staleUpcomingTournaments.length > 0 ? (
                    <div className="space-y-10">
                      {upcomingTournaments.length > 0 ? (
                        <div className={tournamentGridClass}>
                          {upcomingTournaments.map((tournament) => (
                            <TournamentCard
                              key={tournament._id}
                              tournament={tournament}
                            />
                          ))}
                        </div>
                      ) : null}
                      {staleUpcomingTournaments.length > 0 ? (
                        <Collapsible
                          defaultOpen={false}
                          className="rounded-xl border border-border/60 bg-muted/10"
                        >
                          <CollapsibleTrigger
                            className={cn(
                              "group flex w-full items-center gap-2 rounded-t-xl px-4 py-3 text-left text-sm font-medium text-foreground transition-colors",
                              "hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                              "data-[state=open]:border-b data-[state=open]:border-border/50",
                            )}
                          >
                            <ChevronDown
                              className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180"
                              aria-hidden
                            />
                            <span>Past due</span>
                            <Badge
                              variant="outline"
                              className="ml-0.5 rounded-full border-amber-500/40 bg-amber-500/10 px-2 py-0 text-xs font-semibold tabular-nums text-amber-800 dark:text-amber-300"
                            >
                              {staleUpcomingTournaments.length}
                            </Badge>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="px-4 pb-4 pt-2">
                            <div className={tournamentGridClass}>
                              {staleUpcomingTournaments.map((tournament) => (
                                <TournamentCard
                                  key={tournament._id}
                                  tournament={tournament}
                                  pastScheduledStart
                                />
                              ))}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      ) : null}
                    </div>
                  ) : (
                    <TournamentsOverviewEmpty
                      title="No upcoming tournaments"
                      description="New events will appear here when they're scheduled. Check back soon."
                      icon={
                        <CalendarDays
                          className="h-9 w-9 text-muted-foreground sm:h-10 sm:w-10"
                          aria-hidden
                        />
                      }
                    />
                  )}
                </TabsContent>

                <TabsContent
                  value="completed"
                  className="mt-0 space-y-6 focus-visible:outline-none"
                >
                  {loading ? (
                    <div className={tournamentGridClass}>
                      {[1, 2, 3].map((i) => (
                        <Skeleton
                          key={i}
                          className="h-72 rounded-xl border-2"
                        />
                      ))}
                    </div>
                  ) : completedTournaments.length > 0 ? (
                    <div className={tournamentGridClass}>
                      {completedTournaments.map((tournament) => (
                        <TournamentCard
                          key={tournament._id}
                          tournament={tournament}
                        />
                      ))}
                    </div>
                  ) : (
                    <TournamentsOverviewEmpty
                      title="No completed tournaments"
                      description="Finished events will show up here once results are in."
                      icon={
                        <CheckCircle
                          className="h-9 w-9 text-muted-foreground sm:h-10 sm:w-10"
                          aria-hidden
                        />
                      }
                    />
                  )}
                </TabsContent>
              </Tabs>
            </section>
          )}

          <CreateTournamentDialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
            onSuccess={fetchTournaments}
          />
        </main>
      </div>
    </FeatureGate>
  );
}

export default function TournamentsOverviewPage() {
  return (
    <Suspense fallback={<OverviewLoadingShell />}>
      <TournamentsOverviewContent />
    </Suspense>
  );
}
