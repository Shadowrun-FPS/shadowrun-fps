"use client";

import { usePathname } from "next/navigation";

import { PageTitle } from "@/components/page-title";
import { HERO_BACKGROUND_SRC } from "@/lib/hero-assets";
import type { PageTitleLogoKey } from "@/types";

const pageTitles: Record<
  string,
  { title: string; logo?: PageTitleLogoKey; description: string }
> = {
  "/download": {
    title: "Download",
    logo: "download",
    description: "Download the launcher, sign in with Discord, and play.",
  },
  "/events": {
    title: "Events",
    logo: "events",
    description: "Community events, tournaments, and gatherings",
  },
  "/matches": {
    title: "Matches",
    logo: "matches",
    description:
      "Search ranked best-of-three series and open any game to see its scoreboard.",
  },
  "/troubleshoot": {
    title: "Troubleshooting",
    logo: "troubleshooting",
    description: "Fixes for common errors, controllers, and networking.",
  },
};

export function DocHero() {
  const pathname = usePathname();
  const pageInfo = pageTitles[pathname || ""] || {
    title: "Documentation",
    description: "Guides and resources for Shadowrun FPS",
  };

  return (
    <div className="overflow-hidden relative">
      {/* Hero Image with improved styling */}
      <div
        className="relative h-72 bg-center bg-no-repeat bg-cover sm:h-80 md:h-96 lg:h-[32rem] xl:h-[36rem]"
        style={{ backgroundImage: `url('${HERO_BACKGROUND_SRC}')` }}
      >
        {/* Light scrim: keeps the background visible while text stays readable */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/25 to-black/60" />

        {/* Decorative shape overlay */}
        <div className="absolute inset-0">
          <div className="absolute right-0 bottom-0 left-0 h-1/3 bg-gradient-to-t to-transparent from-background via-background/80" />
        </div>

        {/* Content: page wordmark centered in the hero, description pinned low */}
        <div className="relative z-10 flex h-full flex-col justify-end px-4 pb-3 pt-2 sm:px-6 sm:pb-4 md:px-8 md:pb-8 lg:pb-12">
          <div className="flex min-h-0 flex-1 items-center justify-center">
            <PageTitle logo={pageInfo.logo}>{pageInfo.title}</PageTitle>
          </div>
          <p className="mx-auto max-w-2xl text-center text-sm leading-snug text-gray-100 drop-shadow-md md:text-base lg:text-lg">
            {pageInfo.description}
          </p>
        </div>
      </div>
    </div>
  );
}
