import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import RivalryClient from "./rivalry-client";
import { getLeaderboard } from "@/lib/leaderboard";
import { PLAYER_ID_PATTERN } from "@/lib/rivals/config";
import { parsePairParam } from "@/lib/rivals/pairs";
import { ogImages } from "@/lib/og-images";
import { safeLog } from "@/lib/security";
import type { LeaderboardPayload } from "@/types";

export const revalidate = 60;

const SITE_URL = "https://www.shadowrunfps.com";
const RIVALS_PATH = "/leaderboard/rivals";
const PAGE_DESCRIPTION = "Recorded opposing-team series between two ranked players.";

function requestedPlayer(value: string | string[] | undefined): string | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw || !PLAYER_ID_PATTERN.test(raw)) return null;
  return raw.toLowerCase();
}

function namesFor(data: LeaderboardPayload, playerIds: [string, string]): string[] {
  const byId = new Map(
    [...data.players, ...(data.unlistedPlayers ?? [])].map((player) => [player.id.toLowerCase(), player.name]),
  );
  return playerIds.flatMap((id) => {
    const name = byId.get(id);
    return name ? [name] : [];
  });
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ pair: string }>;
  searchParams: Promise<{ player?: string | string[] }>;
}): Promise<Metadata> {
  const [{ pair }, query] = await Promise.all([params, searchParams]);
  const parsed = parsePairParam(pair);
  const canonical = parsed ? `${RIVALS_PATH}/${parsed.key}` : RIVALS_PATH;
  let names: string[] = [];
  if (parsed) {
    try {
      const data = await getLeaderboard();
      if (data) names = namesFor(data, parsed.playerIds);
    } catch (error) {
      safeLog.error("Failed to build rivalry metadata:", error);
    }
  }

  const named = names.length === 2;
  const title = named ? `${names[0]} vs ${names[1]}` : "Rivalry";
  const description = named
    ? `Recorded opposing-team series between ${names[0]} and ${names[1]}.`
    : PAGE_DESCRIPTION;
  const brandedTitle = `${title} | Shadowrun FPS`;
  const viewer = requestedPlayer(query.player);
  const sharePath =
    parsed && viewer && parsed.playerIds.includes(viewer) ? `${canonical}?player=${viewer}` : canonical;

  return {
    title: { absolute: brandedTitle },
    description,
    alternates: { canonical },
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

function structuredData(pairPath: string, name: string) {
  return [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
        { "@type": "ListItem", position: 2, name: "Ranked Leaderboard", item: `${SITE_URL}/leaderboard` },
        { "@type": "ListItem", position: 3, name: "Rivals", item: `${SITE_URL}${RIVALS_PATH}` },
        { "@type": "ListItem", position: 4, name, item: `${SITE_URL}${pairPath}` },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name,
      description: PAGE_DESCRIPTION,
      url: `${SITE_URL}${pairPath}`,
      isPartOf: { "@type": "WebSite", name: "Shadowrun FPS", url: SITE_URL },
      about: "Shadowrun FPS ranked opposing-team series",
    },
  ];
}

export default async function RivalryPage({
  params,
  searchParams,
}: {
  params: Promise<{ pair: string }>;
  searchParams: Promise<{ player?: string | string[] }>;
}) {
  const [{ pair }, query] = await Promise.all([params, searchParams]);
  const parsed = parsePairParam(pair);
  if (!parsed) notFound();

  const playerId = requestedPlayer(query.player);
  if (pair !== parsed.key) {
    const suffix = playerId ? `?player=${playerId}` : "";
    redirect(`/leaderboard/rivals/${parsed.key}${suffix}`);
  }

  let data = null;
  try {
    data = await getLeaderboard();
  } catch (error) {
    safeLog.error("Failed to load rivalry:", error);
  }

  const names = data ? namesFor(data, parsed.playerIds) : [];
  const pageName = names.length === 2 ? `${names[0]} vs ${names[1]}` : "Rivalry";

  return (
    <div className="mx-auto w-full min-w-0 max-w-5xl space-y-4 px-3 pb-10 pt-4 sm:space-y-6 sm:px-6 sm:pt-8 lg:px-8">
      {structuredData(`${RIVALS_PATH}/${parsed.key}`, pageName).map((schema) => (
        <script key={schema["@type"]} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      ))}
      <RivalryClient
        initialData={data}
        pairKey={parsed.key}
        playerIds={parsed.playerIds}
        initialPlayerId={playerId}
      />
    </div>
  );
}
