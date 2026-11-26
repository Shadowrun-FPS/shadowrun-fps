import type { Metadata } from "next";
import { Suspense } from "react";

import CompareClient from "./compare-client";
import { compareHref, emptyCompareQuery, parseCompareSearch } from "@/lib/compare/query";
import { listMaps, listModes } from "@/lib/compare/sample";
import { getLeaderboard } from "@/lib/leaderboard";
import { ogImages } from "@/lib/og-images";
import { safeLog } from "@/lib/security";
import type { LeaderboardPayload } from "@/types";

export const revalidate = 60;

const SITE_URL = "https://www.shadowrunfps.com";
const CANONICAL_PATH = "/leaderboard/compare";
const PAGE_TITLE = "Compare Ranked Players";
const PAGE_DESCRIPTION =
  "Compare recorded Shadowrun FPS matches for two to four ranked players, side by side.";

function first(value: string | string[] | undefined): string | null {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw ?? null;
}

function listedNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? "";
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
}

function versusTitle(names: string[]): string {
  const full = names.join(" vs ");
  if (full.length <= 55) return full;
  return `${names[0]} vs ${names[1]}`;
}

function namesFor(data: LeaderboardPayload, playerIds: string[]): string[] {
  const byId = new Map(
    [...data.players, ...(data.unlistedPlayers ?? [])].map((player) => [player.id, player.name]),
  );
  return playerIds.flatMap((id) => {
    const name = byId.get(id);
    return name ? [name] : [];
  });
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ players?: string | string[] }>;
}): Promise<Metadata> {
  const params = await searchParams;
  let names: string[] = [];
  let sharePath = CANONICAL_PATH;
  try {
    const data = await getLeaderboard();
    if (data) {
      const roster = new Set(
        [...data.players, ...(data.unlistedPlayers ?? [])].map((player) => player.id),
      );
      const query = parseCompareSearch({ players: first(params.players) }, { playerIds: roster });
      names = namesFor(data, query.playerIds);
      if (names.length >= 2) {
        sharePath = compareHref({ ...emptyCompareQuery(), playerIds: query.playerIds });
      }
    }
  } catch (error) {
    safeLog.error("Failed to build comparison metadata:", error);
  }

  const named = names.length >= 2;
  const title = named ? versusTitle(names) : PAGE_TITLE;
  const description = named
    ? `Side-by-side ranked records for ${listedNames(names)}.`
    : PAGE_DESCRIPTION;
  const brandedTitle = `${title} | Shadowrun FPS`;

  return {
    title: { absolute: brandedTitle },
    description,
    alternates: { canonical: CANONICAL_PATH },
    authors: [{ name: "Shadowrun FPS Community", url: SITE_URL }],
    creator: "Shadowrun FPS Community",
    publisher: "Shadowrun FPS Community",
    openGraph: {
      title: brandedTitle,
      description,
      url: `${SITE_URL}${sharePath}`,
      siteName: "Shadowrun FPS",
      locale: "en_US",
      type: "website",
      images: ogImages("leaderboard"),
    },
    twitter: {
      card: "summary_large_image",
      title: brandedTitle,
      description,
      images: ogImages("leaderboard"),
      creator: "@ShadowrunFPS",
    },
  };
}

function structuredData() {
  return [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
        { "@type": "ListItem", position: 2, name: "Ranked Leaderboard", item: `${SITE_URL}/leaderboard` },
        { "@type": "ListItem", position: 3, name: "Compare Ranked Players", item: `${SITE_URL}${CANONICAL_PATH}` },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: PAGE_TITLE,
      description: PAGE_DESCRIPTION,
      url: `${SITE_URL}${CANONICAL_PATH}`,
      isPartOf: { "@type": "WebSite", name: "Shadowrun FPS", url: SITE_URL },
      about: "Shadowrun FPS ranked player statistics",
    },
  ];
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{
    players?: string | string[];
    window?: string | string[];
    map?: string | string[];
    mode?: string | string[];
    scope?: string | string[];
  }>;
}) {
  const params = await searchParams;
  let data = null;
  try {
    data = await getLeaderboard();
  } catch (error) {
    safeLog.error("Failed to load comparison:", error);
  }

  const roster = data ? [...data.players, ...(data.unlistedPlayers ?? [])] : [];
  const initialQuery = data
    ? parseCompareSearch(
        {
          players: first(params.players),
          window: first(params.window),
          map: first(params.map),
          mode: first(params.mode),
          scope: first(params.scope),
        },
        {
          playerIds: new Set(roster.map((player) => player.id)),
          maps: new Set(listMaps(data.matches)),
          modes: listModes(data.matches),
        },
      )
    : emptyCompareQuery();

  return (
    <div className="mx-auto w-full min-w-0 max-w-5xl space-y-4 overflow-x-hidden px-3 pb-10 pt-4 sm:space-y-6 sm:px-6 sm:pt-8 lg:px-8">
      {structuredData().map((schema) => (
        <script key={schema["@type"]} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      ))}
      <Suspense
        fallback={
          <div className="h-24 animate-pulse rounded-xl bg-muted/50" aria-busy="true" />
        }
      >
        <CompareClient initialData={data} initialQuery={initialQuery} />
      </Suspense>
    </div>
  );
}
