"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, ChevronRight, Swords, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { safeLog } from "@/lib/security";
import { useFeatureFlag } from "@/lib/use-feature-flag";
import { cn } from "@/lib/utils";
import type { TournamentListing } from "@/types";

type ScrimmageDoc = {
  _id: string;
  status?: string;
  proposedDate?: string;
  counterProposedDate?: string;
};

function teamInRegisteredList(
  registered: TournamentListing["registeredTeams"],
  teamId: string,
): boolean {
  if (!registered || !Array.isArray(registered)) return false;
  return registered.some((entry) => {
    if (typeof entry === "string") return entry === teamId;
    if (entry && typeof entry === "object" && "_id" in entry) {
      return String((entry as { _id: string })._id) === teamId;
    }
    return false;
  });
}

function scrimmageSortTime(s: ScrimmageDoc): number {
  const raw = s.proposedDate || s.counterProposedDate;
  if (!raw) return Number.MAX_SAFE_INTEGER;
  const t = new Date(raw).getTime();
  return Number.isNaN(t) ? Number.MAX_SAFE_INTEGER : t;
}

type EventRow = {
  kind: "tournament" | "scrimmage";
  id: string;
  title: string;
  date: string;
  href: string;
  status: string;
  sort: number;
  /** 0 = normal ordering; 1 = stale tournament (listed after future events). */
  sortBucket: number;
};

type TeamUpcomingEventsProps = {
  teamId: string;
  panelClassName: string;
};

export function TeamUpcomingEvents({
  teamId,
  panelClassName,
}: TeamUpcomingEventsProps) {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<EventRow[]>([]);
  const tournamentsEnabled = useFeatureFlag("tournaments");
  const scrimmageEnabled = useFeatureFlag("scrimmage");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const { deduplicatedFetch } =
          await import("@/lib/request-deduplication");
        const [tournamentsRaw, scrimmagesRaw] = await Promise.all([
          deduplicatedFetch<TournamentListing[]>("/api/tournaments", {
            ttl: 120000,
          }).catch(() => [] as TournamentListing[]),
          fetch(`/api/scrimmages?teamId=${encodeURIComponent(teamId)}`)
            .then((r) => (r.ok ? r.json() : []))
            .catch(() => []),
        ]);
        if (cancelled) return;

        const tournaments = Array.isArray(tournamentsRaw) ? tournamentsRaw : [];
        const scrimmages: ScrimmageDoc[] = Array.isArray(scrimmagesRaw)
          ? scrimmagesRaw
          : [];
        const now = Date.now();

        const built: EventRow[] = [];

        for (const t of tournaments) {
          if (t.status !== "upcoming" && t.status !== "active") continue;
          if (!teamInRegisteredList(t.registeredTeams, teamId)) continue;
          const start = t.startDate ? new Date(t.startDate).getTime() : 0;
          const hasValidStart = Boolean(t.startDate && !Number.isNaN(start));
          const staleUpcoming =
            t.status === "upcoming" &&
            hasValidStart &&
            start < now;
          const dateLabel =
            t.startDate && !Number.isNaN(start)
              ? new Date(t.startDate).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "Date TBD";
          const statusLabel =
            t.status === "active"
              ? "Live"
              : staleUpcoming
                ? "Past start"
                : "Upcoming";
          built.push({
            kind: "tournament",
            id: t._id,
            title: t.name,
            date: dateLabel,
            href: `/tournaments/${t._id}`,
            status: statusLabel,
            sort: Number.isNaN(start) ? 0 : start,
            sortBucket: staleUpcoming ? 1 : 0,
          });
        }

        for (const s of scrimmages) {
          const st = (s.status || "").toLowerCase();
          if (st === "completed" || st === "rejected") continue;
          const sortT = scrimmageSortTime(s);
          if (
            sortT !== Number.MAX_SAFE_INTEGER &&
            sortT < now - 24 * 60 * 60 * 1000
          )
            continue;

          const raw = s.proposedDate || s.counterProposedDate;
          let dateLabel = "Schedule TBD";
          if (raw) {
            const d = new Date(raw);
            if (!Number.isNaN(d.getTime())) {
              dateLabel = d.toLocaleString(undefined, {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              });
            }
          }
          const statusLabel =
            st === "pending"
              ? "Pending"
              : st === "accepted"
                ? "Scheduled"
                : st === "counterproposal"
                  ? "Counter"
                  : s.status || "Scrimmage";

          built.push({
            kind: "scrimmage",
            id: s._id,
            title: "Scrimmage",
            date: dateLabel,
            href: `/tournaments/scrimmages/${s._id}`,
            status: statusLabel,
            sort: sortT === Number.MAX_SAFE_INTEGER ? now : sortT,
            sortBucket: 0,
          });
        }

        built.sort(
          (a, b) =>
            a.sortBucket - b.sortBucket || a.sort - b.sort,
        );
        setRows(built);
      } catch (e) {
        safeLog.error("Team upcoming events fetch failed:", e);
        setRows([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [teamId]);

  const empty = !loading && rows.length === 0;

  const fillerCopy =
    tournamentsEnabled && scrimmageEnabled
      ? "Room for more on the calendar—register for a tournament or arrange a scrimmage to fill this space."
      : tournamentsEnabled
        ? "Room for more on the calendar—register for a tournament to fill this space."
        : scrimmageEnabled
          ? "Room for more on the calendar—arrange a scrimmage to fill this space."
          : "More upcoming matches will appear here when they are scheduled.";

  const emptyDescription =
    tournamentsEnabled && scrimmageEnabled
      ? "When this team registers for a tournament or sets up a scrimmage, upcoming matches will show here."
      : tournamentsEnabled
        ? "When this team registers for a tournament, upcoming matches will show here."
        : scrimmageEnabled
          ? "When this team sets up a scrimmage, upcoming matches will show here."
          : "When this team has upcoming matches, they will show here.";

  const showFillerCtas = tournamentsEnabled || scrimmageEnabled;

  const scheduleMoreFooter = (
    <div
      role="note"
      className="flex min-h-[5rem] flex-1 flex-col justify-center border-t border-dashed border-border/45 bg-muted/[0.08] px-4 py-4 text-center sm:min-h-[6rem] sm:px-5"
    >
      <p className="mx-auto max-w-md text-xs leading-relaxed text-muted-foreground sm:text-sm">
        {fillerCopy}
      </p>
      {showFillerCtas ? (
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {tournamentsEnabled ? (
            <Button variant="outline" size="sm" className="rounded-full" asChild>
              <Link href="/tournaments">Tournaments</Link>
            </Button>
          ) : null}
          {scrimmageEnabled ? (
            <Button variant="outline" size="sm" className="rounded-full" asChild>
              <Link href="/tournaments/scrimmages">Scrimmages</Link>
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );

  return (
    <section
      aria-labelledby="upcoming-events-heading"
      className="flex min-h-[280px] min-w-0 flex-col lg:min-h-[420px]"
    >
      <h2
        id="upcoming-events-heading"
        className="mb-4 shrink-0 text-base font-semibold tracking-tight text-foreground sm:text-lg"
      >
        Upcoming events
      </h2>
      <div
        className={cn(
          panelClassName,
          "flex min-h-0 flex-1 flex-col overflow-hidden",
        )}
      >
        {loading ? (
          <div className="flex min-h-0 flex-1 flex-col">
            <ul className="shrink-0 space-y-2 p-3 sm:p-4" aria-busy="true">
              {Array.from({ length: 3 }).map((_, i) => (
                <li
                  key={i}
                  className="flex gap-2.5 rounded-lg border border-border/40 bg-background/30 p-2.5 sm:gap-3 sm:p-3"
                >
                  <Skeleton className="h-9 w-9 shrink-0 rounded-lg sm:h-10 sm:w-10" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton className="h-3.5 w-40 max-w-full sm:h-4" />
                    <Skeleton className="h-3 w-28 max-w-full" />
                  </div>
                </li>
              ))}
            </ul>
            <div
              className="min-h-[5rem] flex-1 border-t border-dashed border-border/25 bg-muted/[0.04] sm:min-h-[6rem]"
              aria-hidden
            />
          </div>
        ) : empty ? (
          <div className="flex flex-1 flex-col items-center justify-center px-5 py-10 text-center sm:px-8 sm:py-12">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-border/60 bg-background/50">
              <Calendar className="h-7 w-7 text-muted-foreground" aria-hidden />
            </div>
            <p className="text-sm font-medium text-foreground">
              Nothing scheduled yet
            </p>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              {emptyDescription}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-full"
                asChild
              >
                <Link href="/tournaments/teams">Browse teams</Link>
              </Button>
              {scrimmageEnabled ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  asChild
                >
                  <Link href="/tournaments/scrimmages">Scrimmages</Link>
                </Button>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col">
            <ul className="shrink-0 flex flex-col gap-2 p-3 sm:gap-2.5 sm:p-4">
              {rows.map((r) => (
                <li key={`${r.kind}-${r.id}`}>
                  <Link
                    href={r.href}
                    className="group flex gap-2.5 rounded-lg border border-border/50 bg-background/30 p-2.5 transition-colors hover:border-border hover:bg-background/50 sm:items-start sm:gap-3 sm:p-3"
                  >
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-background/50 text-primary sm:h-10 sm:w-10 sm:rounded-xl"
                      aria-hidden
                    >
                      {r.kind === "tournament" ? (
                        <Trophy className="h-4 w-4 sm:h-5 sm:w-5" />
                      ) : (
                        <Swords className="h-4 w-4 sm:h-5 sm:w-5" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium leading-snug text-foreground group-hover:text-primary sm:text-base">
                        {r.title}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {r.date}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5 self-center sm:flex-row sm:items-center sm:gap-2 sm:self-start sm:pt-0.5">
                      <Badge
                        variant="secondary"
                        className={cn(
                          "whitespace-nowrap capitalize",
                          r.status === "Past start" &&
                            "border-amber-500/35 bg-amber-500/10 text-amber-700 dark:text-amber-400",
                        )}
                      >
                        {r.status}
                      </Badge>
                      <ChevronRight
                        className="h-4 w-4 shrink-0 text-muted-foreground opacity-60 transition-opacity group-hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                        aria-hidden
                      />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
            {scheduleMoreFooter}
          </div>
        )}
      </div>
    </section>
  );
}
