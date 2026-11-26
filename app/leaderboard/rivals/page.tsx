import type { Metadata } from "next";

import RivalsClient from "./rivals-client";
import { getLeaderboard } from "@/lib/leaderboard";
import { PLAYER_ID_PATTERN } from "@/lib/rivals/config";
import { ogImages } from "@/lib/og-images";
import { safeLog } from "@/lib/security";
import type { LeaderboardPayload } from "@/types";

export const revalidate = 60;

const SITE_URL = "https://www.shadowrunfps.com";
const CANONICAL_PATH = "/leaderboard/rivals";
const PAGE_TITLE = "Rivals";
const PAGE_DESCRIPTION = "Opposing-team rivalries from recorded ranked matches.";

function requestedPlayer(value: string | string[] | undefined): string | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw || !PLAYER_ID_PATTERN.test(raw)) return null;
  return raw.toLowerCase();
}

function nameFor(data: LeaderboardPayload, playerId: string): string | null {
  const player = [...data.players, ...(data.unlistedPlayers ?? [])].find(
    (entry) => entry.id.toLowerCase() === playerId,
  );
  return player?.name ?? null;
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ player?: string | string[] }>;
}): Promise<Metadata> {
  const params = await searchParams;
  const playerId = requestedPlayer(params.player);
  let name: string | null = null;
  if (playerId) {
    try {
      const data = await getLeaderboard();
      if (data) name = nameFor(data, playerId);
    } catch (error) {
      safeLog.error("Failed to build rivals metadata:", error);
    }
  }

  const title = name ? `${name}'s Rivals` : PAGE_TITLE;
  const description = name
    ? `Opposing-team rivalries for ${name} from recorded ranked matches.`
    : PAGE_DESCRIPTION;
  const brandedTitle = `${title} | Shadowrun FPS`;
  const sharePath = name && playerId ? `${CANONICAL_PATH}?player=${playerId}` : CANONICAL_PATH;

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
        { "@type": "ListItem", position: 3, name: "Rivals", item: `${SITE_URL}${CANONICAL_PATH}` },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: PAGE_TITLE,
      description: PAGE_DESCRIPTION,
      url: `${SITE_URL}${CANONICAL_PATH}`,
      isPartOf: { "@type": "WebSite", name: "Shadowrun FPS", url: SITE_URL },
      about: "Shadowrun FPS ranked opposing-team rivalries",
    },
  ];
}

export default async function RivalsPage({
  searchParams,
}: {
  searchParams: Promise<{ player?: string | string[] }>;
}) {
  const params = await searchParams;
  let data = null;
  try {
    data = await getLeaderboard();
  } catch (error) {
    safeLog.error("Failed to load rivals:", error);
  }

  return (
    <div className="mx-auto w-full min-w-0 max-w-5xl space-y-4 px-3 pb-10 pt-4 sm:space-y-6 sm:px-6 sm:pt-8 lg:px-8">
      {structuredData().map((schema) => (
        <script key={schema["@type"]} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      ))}
      <RivalsClient initialData={data} initialPlayerId={requestedPlayer(params.player)} />
    </div>
  );
}
