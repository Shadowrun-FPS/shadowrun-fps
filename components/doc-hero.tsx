"use client";

import { usePathname } from "next/navigation";

const pageTitles: Record<string, { title: string; description: string }> = {
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
        style={{ backgroundImage: "url('/hero.png')" }}
      >
        {/* Enhanced gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
        <div className="absolute inset-0 bg-gradient-to-r via-transparent from-black/40 to-black/40" />

        {/* Decorative shape overlay */}
        <div className="absolute inset-0">
          <div className="absolute right-0 bottom-0 left-0 h-1/3 bg-gradient-to-t to-transparent from-background via-background/80" />
        </div>

        {/* Content - Positioned lower in the hero */}
        <div className="flex relative z-10 justify-center items-end px-4 pb-4 h-full sm:px-6 sm:pb-6 md:px-8 md:pb-8 lg:pb-12">
          <div className="text-center">
            <h1 className="text-xl font-bold tracking-tight text-white drop-shadow-lg sm:text-2xl md:text-3xl lg:text-4xl">
              {pageInfo.title}
            </h1>
            <p className="mt-2 text-xs text-gray-200 drop-shadow-md sm:text-sm md:text-base lg:text-lg">
              {pageInfo.description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
