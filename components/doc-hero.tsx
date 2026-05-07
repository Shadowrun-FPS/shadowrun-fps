"use client";

import { usePathname } from "next/navigation";

const pageTitles: Record<string, { title: string; description: string }> = {
  "/download": {
    title: "Download",
    description:
      "Community launcher, verified builds, and installation resources",
  },
  "/docs/events": {
    title: "Events",
    description: "Community events, tournaments, and gatherings",
  },
  "/docs/install": {
    title: "Installation Guide",
    description: "Step-by-step instructions to get Shadowrun FPS running",
  },
  "/docs/troubleshoot": {
    title: "Troubleshooting",
    description: "Solutions to common issues and performance tips",
  },
  "/docs/introduction": {
    title: "Introduction",
    description: "Welcome to Shadowrun FPS documentation",
  },
  "/docs/rules": {
    title: "Rules",
    description: "Community rules and guidelines",
  },
  "/docs/support": {
    title: "Support",
    description: "Get help and support from the community",
  },
  "/docs/tutorials": {
    title: "Tutorials",
    description: "Learn how to play and improve your skills",
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
        style={{ backgroundImage: "url('/hero.webp')" }}
      >
        {/* Enhanced gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
        <div className="absolute inset-0 bg-gradient-to-r via-transparent from-black/40 to-black/40" />

        {/* Decorative shape overlay */}
        <div className="absolute inset-0">
          <div className="absolute right-0 bottom-0 left-0 h-1/3 bg-gradient-to-t to-transparent from-background via-background/80" />
        </div>

        {/* Content — pinned low; flush bottom on narrow screens so title sits near hero edge */}
        <div className="relative z-10 flex h-full flex-col justify-end px-4 pb-0 pt-2 sm:px-6 sm:pb-2 md:px-8 md:pb-8 lg:pb-12">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-[0_2px_24px_rgba(0,0,0,0.85)] [text-shadow:_0_2px_16px_rgb(0_0_0_/_0.75)] lg:text-4xl">
              {pageInfo.title}
            </h1>
            <p className="mt-2.5 text-sm leading-snug text-gray-100 drop-shadow-md md:mt-3 md:text-base lg:text-lg">
              {pageInfo.description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
