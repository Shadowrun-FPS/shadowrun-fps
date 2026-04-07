export type TeamsPageView = "grid" | "list";
export type TeamsPageTeamStatus = "all" | "full" | "open";
export type TeamsPageSort = "elo" | "winRatio" | "wins" | "losses" | "name";

const DEFAULTS = {
  tournament: "all",
  size: "4",
  status: "all" as TeamsPageTeamStatus,
  view: "grid" as TeamsPageView,
  page: 1,
  sort: "elo" as TeamsPageSort,
  order: "desc" as "asc" | "desc",
};

export type TeamsPageUrlState = {
  q: string;
  tournament: string;
  size: string;
  status: TeamsPageTeamStatus;
  view: TeamsPageView;
  page: number;
  sort: TeamsPageSort;
  order: "asc" | "desc";
};

function parseTeamStatus(value: string | null): TeamsPageTeamStatus {
  if (value === "full" || value === "open") return value;
  return DEFAULTS.status;
}

function parseView(value: string | null): TeamsPageView {
  if (value === "list") return "list";
  return DEFAULTS.view;
}

function parseSort(value: string | null): TeamsPageSort {
  if (
    value === "elo" ||
    value === "winRatio" ||
    value === "wins" ||
    value === "losses" ||
    value === "name"
  ) {
    return value;
  }
  return DEFAULTS.sort;
}

export function parseTeamsPageSearchParams(
  searchParams: URLSearchParams
): TeamsPageUrlState {
  const pageRaw = parseInt(searchParams.get("page") || "1", 10);
  const page = Number.isFinite(pageRaw) && pageRaw >= 1 ? pageRaw : DEFAULTS.page;
  const orderParam = searchParams.get("order");
  return {
    q: searchParams.get("q") ?? "",
    tournament: searchParams.get("tournament") ?? DEFAULTS.tournament,
    size: searchParams.get("size") ?? DEFAULTS.size,
    status: parseTeamStatus(searchParams.get("status")),
    view: parseView(searchParams.get("view")),
    page,
    sort: parseSort(searchParams.get("sort")),
    order: orderParam === "asc" ? "asc" : DEFAULTS.order,
  };
}

/** Canonical query string for comparisons (avoids spurious mismatches from param ordering). */
export function serializeTeamsPageState(state: TeamsPageUrlState): string {
  return buildTeamsPageSearchParams(state).toString();
}

export function buildTeamsPageSearchParams(state: TeamsPageUrlState): URLSearchParams {
  const sp = new URLSearchParams();
  const q = state.q.trim();
  if (q) sp.set("q", q);
  if (state.tournament !== DEFAULTS.tournament) sp.set("tournament", state.tournament);
  if (state.size !== DEFAULTS.size) sp.set("size", state.size);
  if (state.status !== DEFAULTS.status) sp.set("status", state.status);
  if (state.view !== DEFAULTS.view) sp.set("view", state.view);
  if (state.page > 1) sp.set("page", String(state.page));
  if (state.sort !== DEFAULTS.sort) sp.set("sort", state.sort);
  if (state.order !== DEFAULTS.order) sp.set("order", state.order);
  return sp;
}
