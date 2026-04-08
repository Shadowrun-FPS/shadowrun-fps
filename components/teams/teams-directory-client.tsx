"use client";

import { useSession } from "next-auth/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { CreateTeamForm } from "@/components/teams/create-team-form";
import { TeamsPageHeader } from "@/components/teams/teams-page-header";
import { TeamsActiveTournamentsSection } from "@/components/teams/teams-active-tournaments-section";
import { MyTeamsCarousel } from "@/components/teams/my-teams-carousel";
import { MyTeamsEmptySection } from "@/components/teams/my-teams-empty-section";
import { TeamsPageSectionHeading } from "@/components/teams/teams-page-section-heading";
import { TeamsFiltersContent } from "@/components/teams/teams-filters-content";
import { TeamsFiltersFields } from "@/components/teams/teams-filters-fields";
import { TeamsDirectoryToolbar } from "@/components/teams/teams-directory-toolbar";
import { TeamsDirectoryGrid } from "@/components/teams/teams-directory-grid";
import { TeamsDirectoryListTable } from "@/components/teams/teams-directory-list-table";
import { TeamsDirectoryPagination } from "@/components/teams/teams-directory-pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "@/components/ui/use-toast";
import { safeLog } from "@/lib/security";
import { enhanceTeamsWithTournamentRegistrations } from "@/lib/teams-directory-enhance";
import {
  filterDirectoryTeams,
  sortDirectoryTeams,
} from "@/lib/teams-directory-filter";
import {
  parseTeamsPageSearchParams,
  serializeTeamsPageState,
  type TeamsPageSort,
  type TeamsPageTeamStatus,
  type TeamsPageUrlState,
  type TeamsPageView,
} from "@/lib/teams-page-url";
import { useMediaQuery } from "@/hooks/use-media-query";
import type { TeamListing, TournamentListing } from "@/types";

const TEAMS_PER_PAGE = 9;
const SEARCH_DEBOUNCE_MS = 400;

/** Append teams the user is on that are missing from the directory list (GET /api/teams is capped). */
function mergeMissingUserTeams(
  directory: TeamListing[],
  userTeamsExtra: TeamListing[],
): TeamListing[] {
  if (!userTeamsExtra.length) return directory;
  const ids = new Set(directory.map((t) => String(t._id)));
  const merged = [...directory];
  for (const t of userTeamsExtra) {
    const id = String(t._id);
    if (!ids.has(id)) {
      merged.push(t);
      ids.add(id);
    }
  }
  return merged;
}

type TeamsDirectoryClientProps = {
  initialTeams: TeamListing[];
  initialTournaments: TournamentListing[];
};

export function TeamsDirectoryClient({
  initialTeams,
  initialTournaments,
}: TeamsDirectoryClientProps) {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isMobile = useMediaQuery("(max-width: 639px)");

  const [teams, setTeams] = useState<TeamListing[]>(initialTeams);
  const [tournaments, setTournaments] =
    useState<TournamentListing[]>(initialTournaments);
  const [loading, setLoading] = useState(false);
  const [directoryFetchError, setDirectoryFetchError] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [selectedTournament, setSelectedTournament] = useState("all");
  const [selectedTeamSize, setSelectedTeamSize] = useState("4");
  const [teamStatus, setTeamStatus] = useState<TeamsPageTeamStatus>("all");
  const [view, setView] = useState<TeamsPageView>("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const [sort, setSort] = useState<TeamsPageSort>("elo");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [urlHydrated, setUrlHydrated] = useState(false);

  useEffect(() => {
    setTournaments(initialTournaments);
  }, [initialTournaments]);

  useEffect(() => {
    if (sessionStatus !== "authenticated" || !session?.user?.id) {
      setTeams(initialTeams);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/teams/my-teams");
        if (!res.ok || cancelled) {
          if (!cancelled) setTeams(initialTeams);
          return;
        }
        const mine = (await res.json()) as unknown;
        if (cancelled) return;
        const extra = Array.isArray(mine) ? (mine as TeamListing[]) : [];
        setTeams(mergeMissingUserTeams(initialTeams, extra));
      } catch {
        if (!cancelled) setTeams(initialTeams);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [initialTeams, sessionStatus, session?.user?.id]);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQ(searchQuery), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [searchQuery]);

  useEffect(() => {
    const p = parseTeamsPageSearchParams(searchParams);
    setSearchQuery(p.q);
    setDebouncedQ(p.q);
    setSelectedTournament(p.tournament);
    setSelectedTeamSize(p.size);
    setTeamStatus(p.status);
    setView(p.view);
    setCurrentPage(p.page);
    setSort(p.sort);
    setOrder(p.order);
    setUrlHydrated(true);
  }, [searchParams]);

  useEffect(() => {
    if (!urlHydrated) return;
    const state: TeamsPageUrlState = {
      q: debouncedQ,
      tournament: selectedTournament,
      size: selectedTeamSize,
      status: teamStatus,
      view,
      page: currentPage,
      sort,
      order,
    };
    const next = serializeTeamsPageState(state);
    const current = serializeTeamsPageState(parseTeamsPageSearchParams(searchParams));
    if (next === current) return;
    router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
  }, [
    urlHydrated,
    debouncedQ,
    selectedTournament,
    selectedTeamSize,
    teamStatus,
    view,
    currentPage,
    sort,
    order,
    pathname,
    router,
    searchParams,
  ]);

  const fetchTeams = useCallback(async () => {
    try {
      setLoading(true);
      setDirectoryFetchError(false);
      const { deduplicatedFetch } = await import("@/lib/request-deduplication");
      const [teamsData, tournamentData] = await Promise.all([
        deduplicatedFetch<TeamListing[]>("/api/teams", { ttl: 60000 }),
        deduplicatedFetch<TournamentListing[]>("/api/tournaments", { ttl: 30000 }).catch(
          () => [] as TournamentListing[]
        ),
      ]);
      const teamsArray = Array.isArray(teamsData) ? teamsData : [];
      const tournamentsArray = Array.isArray(tournamentData) ? tournamentData : [];
      setTournaments(tournamentsArray);
      let enhanced = enhanceTeamsWithTournamentRegistrations(
        teamsArray,
        tournamentsArray
      );

      try {
        const mineRes = await fetch("/api/teams/my-teams");
        if (mineRes.ok) {
          const mineJson = (await mineRes.json()) as unknown;
          if (Array.isArray(mineJson)) {
            enhanced = mergeMissingUserTeams(enhanced, mineJson as TeamListing[]);
          }
        }
      } catch {
        /* keep directory-only list */
      }

      setTeams(enhanced);
    } catch (error) {
      safeLog.error("Teams directory fetch failed:", error);
      setDirectoryFetchError(true);
      toast({
        variant: "destructive",
        title: "Could not load teams",
        description: "Please try again in a moment.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const onMutationSuccess = useCallback(() => {
    void fetchTeams();
    router.refresh();
  }, [fetchTeams, router]);

  const userTeams = useMemo(() => {
    if (!session?.user?.id) return [];
    return teams.filter(
      (team) =>
        team.members?.some((m) => m.discordId === session.user.id) ||
        team.captain?.discordId === session.user.id
    );
  }, [teams, session?.user?.id]);

  const userTeamIds = useMemo(() => new Set(userTeams.map((t) => t._id)), [userTeams]);

  const filteredTeams = useMemo(() => {
    const filtered = filterDirectoryTeams(teams, userTeamIds, {
      selectedTournament,
      tournaments,
      selectedTeamSize,
      teamStatus,
      searchQuery,
    });
    return sortDirectoryTeams(filtered, sort, order);
  }, [
    teams,
    userTeamIds,
    selectedTournament,
    tournaments,
    selectedTeamSize,
    teamStatus,
    searchQuery,
    sort,
    order,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredTeams.length / TEAMS_PER_PAGE));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const indexOfLastTeam = currentPage * TEAMS_PER_PAGE;
  const indexOfFirstTeam = indexOfLastTeam - TEAMS_PER_PAGE;
  const currentTeams = filteredTeams.slice(indexOfFirstTeam, indexOfLastTeam);

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, []);

  const clearFilters = useCallback(() => {
    setSelectedTournament("all");
    setTeamStatus("all");
    setSelectedTeamSize("4");
    setCurrentPage(1);
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  }, []);

  const handleTournamentChange = useCallback((value: string) => {
    setSelectedTournament(value);
    setCurrentPage(1);
  }, []);

  const handleTeamSizeChange = useCallback((value: string) => {
    setSelectedTeamSize(value);
    setCurrentPage(1);
  }, []);

  const handleTeamStatusChange = useCallback((value: TeamsPageTeamStatus) => {
    setTeamStatus(value);
    setCurrentPage(1);
  }, []);

  const handleSortChange = useCallback((value: TeamsPageSort) => {
    setSort(value);
    setCurrentPage(1);
  }, []);

  const handleOrderChange = useCallback((value: "asc" | "desc") => {
    setOrder(value);
    setCurrentPage(1);
  }, []);

  const showClearFilters =
    selectedTournament !== "all" || teamStatus !== "all" || selectedTeamSize !== "4";

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (debouncedQ.trim()) n += 1;
    if (selectedTournament !== "all") n += 1;
    if (selectedTeamSize !== "4") n += 1;
    if (teamStatus !== "all") n += 1;
    return n;
  }, [debouncedQ, selectedTournament, selectedTeamSize, teamStatus]);

  const handlePageChange = useCallback((pageNumber: number) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const resultsAnnouncement = useMemo(() => {
    const n = filteredTeams.length;
    return `${n} ${n === 1 ? "team" : "teams"} match your filters.`;
  }, [filteredTeams.length]);

  const showMyTeamsCarousel = sessionStatus === "authenticated" && userTeams.length > 0;
  const showMyTeamsEmpty =
    sessionStatus === "authenticated" && userTeams.length === 0;

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-screen-xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10 xl:px-12">
        <p className="sr-only" aria-live="polite" aria-atomic="true">
          {urlHydrated ? resultsAnnouncement : ""}
        </p>
        <TeamsPageHeader
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          onCreateSuccess={onMutationSuccess}
        />

        <TeamsActiveTournamentsSection
          tournaments={tournaments}
          formatDate={formatDate}
        />

        {showMyTeamsCarousel ? <MyTeamsCarousel userTeams={userTeams} /> : null}
        {showMyTeamsEmpty ? (
          <MyTeamsEmptySection onCreateSuccess={onMutationSuccess} />
        ) : null}

        <div className="mt-8 sm:mt-12">
          <TeamsPageSectionHeading
            icon={Users}
            title="All Teams"
            description="Browse or search for teams"
            className="mb-6 sm:mb-8"
          />

          <div className="hidden sm:block">
            <TeamsFiltersContent
              tournaments={tournaments}
              selectedTournament={selectedTournament}
              onTournamentChange={handleTournamentChange}
              selectedTeamSize={selectedTeamSize}
              onTeamSizeChange={handleTeamSizeChange}
              teamStatus={teamStatus}
              onTeamStatusChange={handleTeamStatusChange}
              onClearFilters={clearFilters}
              showClearButton={showClearFilters}
            />
          </div>

          <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
            <SheetContent side="bottom" className="max-h-[92vh] overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <div className="py-4">
                <TeamsFiltersFields
                  tournaments={tournaments}
                  selectedTournament={selectedTournament}
                  onTournamentChange={handleTournamentChange}
                  selectedTeamSize={selectedTeamSize}
                  onTeamSizeChange={handleTeamSizeChange}
                  teamStatus={teamStatus}
                  onTeamStatusChange={handleTeamStatusChange}
                />
              </div>
              <SheetFooter className="flex-row gap-2 sm:justify-between">
                {showClearFilters ? (
                  <Button type="button" variant="ghost" onClick={clearFilters}>
                    Clear filters
                  </Button>
                ) : (
                  <span />
                )}
                <Button type="button" onClick={() => setFiltersOpen(false)}>
                  Done
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>

          <TeamsDirectoryToolbar
            resultCount={filteredTeams.length}
            view={view}
            onViewChange={setView}
            sort={sort}
            order={order}
            onSortChange={handleSortChange}
            onOrderChange={handleOrderChange}
            onOpenMobileFilters={() => setFiltersOpen(true)}
            activeFilterCount={activeFilterCount}
            showMobileFilterButton={isMobile}
          />

          {directoryFetchError ? (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" aria-hidden />
              <AlertTitle>Could not refresh teams</AlertTitle>
              <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span>Your last loaded list is still shown. Try again to get the latest data.</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full shrink-0 border-background/30 bg-background/10 hover:bg-background/20 sm:w-auto"
                  disabled={loading}
                  onClick={() => void fetchTeams()}
                >
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          ) : null}

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="overflow-hidden border-2">
                  <div className="space-y-3 p-4 sm:p-6">
                    <Skeleton className="h-6 w-36" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                </Card>
              ))}
            </div>
          ) : filteredTeams.length > 0 ? (
            <>
              {view === "grid" ? (
                <TeamsDirectoryGrid teams={currentTeams} userTeams={userTeams} />
              ) : (
                <TeamsDirectoryListTable teams={currentTeams} userTeams={userTeams} />
              )}
              <TeamsDirectoryPagination
                currentPage={currentPage}
                totalPages={totalPages}
                indexOfFirstTeam={indexOfFirstTeam}
                indexOfLastTeam={indexOfLastTeam}
                totalTeams={filteredTeams.length}
                onPageChange={handlePageChange}
              />
            </>
          ) : (
            <Card className="border-2 border-dashed">
              <CardContent className="flex flex-col items-center justify-center p-8 sm:p-12">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-border/50 bg-gradient-to-br from-muted to-muted/50 p-4 sm:h-20 sm:w-20">
                  <Users className="h-8 w-8 text-muted-foreground sm:h-10 sm:w-10" aria-hidden />
                </div>
                <h3 className="mb-2 text-lg font-semibold sm:text-xl">No Teams Found</h3>
                <p className="mb-6 max-w-md text-center text-sm text-muted-foreground sm:text-base">
                  {searchQuery
                    ? `No teams match "${searchQuery}"`
                    : selectedTournament !== "all"
                      ? "No teams found for this tournament"
                      : "Create the first team to get started!"}
                </p>
                {searchQuery.trim() ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="mb-4"
                    onClick={() => handleSearchChange("")}
                  >
                    Clear search
                  </Button>
                ) : null}
                {!searchQuery ? <CreateTeamForm onSuccess={onMutationSuccess} /> : null}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
