import { Button } from "@/components/ui/button";
import FeaturedVideos, { hasFeaturedVideo } from "./featured-videos";
import { Download } from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";
import { FloatingPlayer } from "@/components/floating-player";
import DownloadButton from "@/components/download-button";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Shadowrun FPS - FASA Studios' 2007 First Person Multiplayer Shooter",
  description:
    "Join the Shadowrun community and download the classic 2007 FPS for PC. Get installation guides, troubleshooting support, and more!",
  openGraph: {
    title:
      "Shadowrun FPS - FASA Studios' 2007 First Person Multiplayer Shooter",
    description:
      "Join the Shadowrun community and download the classic 2007 FPS for PC. Get installation guides, troubleshooting support, and more!",
    images: [
      {
        url: "https://ShadowrunFPS.com/hero.png",
        width: 1200,
        height: 630,
        alt: "Shadowrun FPS Hero Image",
      },
    ],
    url: "https://ShadowrunFPS.com",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Shadowrun FPS - FASA Studios' 2007 Multiplayer Shooter",
    description:
      "Join the Shadowrun community and download the classic 2007 FPS for PC. Get installation guides, troubleshooting support, and more!",
    images: ["https://ShadowrunFPS.com/hero.png"],
  },
};

// Move schema data outside component
const schemaData = {
  "@context": "https://schema.org",
  "@type": "VideoGame",
  name: "Shadowrun FPS",
  genre: ["First-Person Shooter", "Multiplayer"],
  potentialAction: {
    "@type": "SearchAction",
    target: "https://ShadowrunFPS.com/search?q={search_term_string}",
    "query-input": "required name=search_term_string",
  },
  publisher: {
    "@type": "Organization",
    name: "FASA Studios",
    image: "https://ShadowrunFPS.com/shadowrun_invite_banner.png",
    datePublished: "2007-05-29",
  },
  description:
    "Shadowrun FPS is a 2007 multiplayer shooter by FASA Studios for Xbox 360 and PC. Join the fan community and keep the game alive!",
  platform: ["Xbox 360", "PC"],
  url: "https://ShadowrunFPS.com",
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: "https://ShadowrunFPS.com",
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Events",
      item: "https://www.shadowrunfps.com/docs/events",
    },
    {
      "@type": "ListItem",
      position: 3,
      name: "Shadowrun PC Install Guide",
      item: "https://www.shadowrunfps.com/docs/install",
    },
    {
      "@type": "ListItem",
      position: 4,
      name: "Shadowrun PC Troubleshooting Guide",
      item: "https://www.shadowrunfps.com/docs/troubleshoot",
    },
    {
      "@type": "ListItem",
      position: 5,
      name: "Join the Discord Community",
      item: "discord://discord.com/servers/this-is-shadowrun-930362820627943495",
    },
  ],
};

export default async function Home() {
  const showFeaturedVideo = await hasFeaturedVideo();

  return (
    <>
      {/* Hero Section - Full width with breakout */}
      <div className="relative right-1/2 left-1/2 -mx-0 -mt-6 w-screen -translate-x-1/2 sm:-mx-0 md:-mx-0 lg:-mx-0">
        <section className="relative flex flex-col items-center justify-center min-h-[50vh] sm:min-h-[60vh] md:min-h-[70vh] lg:min-h-screen py-12 sm:py-16 md:py-20">
          {/* Background with proper full-width positioning */}
          <div className="absolute inset-0 w-full h-full">
            <div className="absolute inset-0 bg-center bg-cover bg-hero-image md:bg-fixed" />
          </div>

          {/* Enhanced gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/70 to-background" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent opacity-70" />
          <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_0%,rgba(0,0,0,0.8)_100%)]" />

          <div className="relative z-10 px-3 mx-auto w-full max-w-7xl text-center sm:px-4 md:px-6 lg:px-8">
            {/* Title with enhanced animation */}
            <div className="duration-1000 animate-in slide-in-from-top">
              <h1 className="mb-3 sm:mb-4 text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl [text-shadow:_0_4px_24px_rgba(0,0,0,0.5)]">
                <span className="inline-block bg-clip-text">Shadowrun</span>{" "}
                <span className="inline-block text-primary [text-shadow:_0_4px_24px_rgba(var(--primary),0.5)]">
                  FPS
                </span>
              </h1>
            </div>

            <div className="px-2 mx-auto space-y-4 max-w-3xl duration-1000 delay-300 sm:space-y-6 animate-in fade-in sm:px-0">
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-200 [text-shadow:_0_2px_12px_rgba(0,0,0,0.5)]">
                Welcome to the community hub for the Shadowrun FPS
              </p>

              {/* Buttons - made visible on all screen sizes */}
              <div className="flex flex-col flex-wrap gap-3 justify-center items-stretch sm:flex-row sm:gap-4 sm:items-center">
                <div className="w-full sm:w-auto">
                  <DownloadButton />
                </div>

                <div className="w-full sm:w-auto">
                  <Link
                    href="/docs/troubleshoot"
                    className="inline-flex overflow-hidden relative items-center justify-center w-full px-5 sm:px-6 py-2.5 sm:py-3 text-base sm:text-lg font-medium rounded-lg transition-all group bg-secondary hover:bg-secondary/90 min-h-[44px] sm:min-h-0"
                    aria-label="Go to troubleshooting guide"
                  >
                    <span className="relative z-10 text-secondary-foreground">
                      Troubleshooting
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r transition-transform duration-300 -z-10 from-secondary to-secondary/90 group-hover:scale-110" />
                    <div className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced bottom gradient */}
          <div className="absolute bottom-0 w-full h-24 bg-gradient-to-t to-transparent sm:h-32 from-background via-background/90" />
        </section>
      </div>

      {/* Regular page content starts here */}
      <main className="flex flex-col">
        {/* Quick Links Section */}
        <section className="relative py-12 sm:py-16 md:py-20">
          <div className="relative px-3 mx-auto max-w-7xl sm:px-4 md:px-6 lg:px-8">
            <div className="mx-auto max-w-5xl">
              <h2 className="mb-6 text-2xl font-bold text-center sm:text-3xl md:text-4xl sm:mb-8">
                Getting Started
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <Link
                  href="/docs/install"
                  className="relative p-6 rounded-xl border backdrop-blur-sm transition-all duration-300 group sm:rounded-2xl bg-card/30 hover:bg-card/50 hover:shadow-xl hover:shadow-primary/10 border-border/50 hover:border-primary/50"
                >
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold transition-colors sm:text-xl text-foreground group-hover:text-primary">
                      Installation Guide
                    </h3>
                    <p className="text-sm sm:text-base text-muted-foreground">
                      Step-by-step instructions to get Shadowrun FPS running on
                      your PC
                    </p>
                  </div>
                  <div className="absolute top-4 right-4 opacity-0 transition-opacity group-hover:opacity-100">
                    <svg
                      className="w-5 h-5 text-primary"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </Link>

                <Link
                  href="/docs/troubleshoot"
                  className="relative p-6 rounded-xl border backdrop-blur-sm transition-all duration-300 group sm:rounded-2xl bg-card/30 hover:bg-card/50 hover:shadow-xl hover:shadow-primary/10 border-border/50 hover:border-primary/50"
                >
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold transition-colors sm:text-xl text-foreground group-hover:text-primary">
                      Troubleshooting
                    </h3>
                    <p className="text-sm sm:text-base text-muted-foreground">
                      Fix common issues, optimize performance, and get help
                    </p>
                  </div>
                  <div className="absolute top-4 right-4 opacity-0 transition-opacity group-hover:opacity-100">
                    <svg
                      className="w-5 h-5 text-primary"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </Link>

                <Link
                  href="discord://discord.com/servers/this-is-shadowrun-930362820627943495"
                  className="relative p-6 rounded-xl border backdrop-blur-sm transition-all duration-300 group sm:rounded-2xl bg-card/30 hover:bg-card/50 hover:shadow-xl hover:shadow-primary/10 border-border/50 hover:border-primary/50"
                >
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold transition-colors sm:text-xl text-foreground group-hover:text-primary">
                      Join Discord
                    </h3>
                    <p className="text-sm sm:text-base text-muted-foreground">
                      Connect with the community, get support, and find matches
                    </p>
                  </div>
                  <div className="absolute top-4 right-4 opacity-0 transition-opacity group-hover:opacity-100">
                    <svg
                      className="w-5 h-5 text-primary"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* About Section - Enhanced */}
        <section className="overflow-hidden relative py-12 sm:py-16 md:py-20 lg:py-24">
          <div className="absolute inset-0">
            <div className="absolute inset-0 opacity-20 bg-grid-white/5 animate-grid-flow" />
            <div className="absolute inset-0 bg-gradient-to-b via-transparent from-background to-background" />
          </div>

          <div className="relative px-3 mx-auto max-w-7xl sm:px-4 md:px-6 lg:px-8">
            <div className="mx-auto max-w-5xl">
              <div className="p-4 rounded-xl backdrop-blur-sm transition-all duration-500 sm:p-6 md:p-8 sm:rounded-2xl bg-card/30 hover:bg-card/40 hover:shadow-2xl hover:shadow-primary/5">
                <h2 className="text-2xl font-bold text-center sm:text-3xl md:text-4xl lg:text-5xl">
                  <span className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary/90 to-primary animate-gradient">
                    About Shadowrun FPS
                  </span>
                </h2>
                <div className="mt-6 space-y-4 sm:mt-8 sm:space-y-6">
                  <p className="text-base text-center sm:text-lg md:text-xl text-muted-foreground">
                    Welcome to{" "}
                    <strong className="text-primary">This Is Shadowrun</strong>,
                    the ultimate fan site for FASA Studios&apos; 2007 Shadowrun
                    FPS.
                  </p>
                  <p className="text-base text-center sm:text-lg md:text-xl text-muted-foreground">
                    Join our community, explore game guides, and connect with
                    other players keeping the game alive!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Videos Section - Fixed width - Only show if video is configured */}
        {showFeaturedVideo && (
          <section className="relative py-12 sm:py-16 md:py-20 lg:py-24">
            <div className="relative px-3 mx-auto max-w-7xl sm:px-4 md:px-6 lg:px-8">
              <div className="max-w-full sm:max-w-[95%] lg:max-w-5xl mx-auto">
                <div className="relative mb-8 text-center sm:mb-10 md:mb-12">
                  <h2 className="inline-block text-2xl font-bold sm:text-3xl md:text-4xl lg:text-5xl">
                    Featured Videos
                    <div className="absolute right-0 left-0 -bottom-2 h-px bg-gradient-to-r from-transparent to-transparent animate-pulse sm:-bottom-4 via-primary" />
                  </h2>
                </div>
                <div className="relative">
                  <div className="absolute -top-16 -left-16 w-32 h-32 rounded-full blur-3xl transition-all duration-1000 sm:-top-32 sm:-left-32 sm:w-64 sm:h-64 bg-primary/5 animate-pulse-slow" />
                  <div className="absolute -right-16 -bottom-16 w-32 h-32 rounded-full blur-3xl transition-all duration-1000 delay-500 sm:-right-32 sm:-bottom-32 sm:w-64 sm:h-64 bg-primary/5 animate-pulse-slow" />

                  <div className="overflow-hidden relative rounded-lg backdrop-blur-sm sm:rounded-xl bg-card/30">
                    <div className="absolute inset-0">
                      <div className="absolute inset-0 bg-gradient-to-t to-transparent from-background/90 via-background/50" />
                    </div>

                    <div className="relative z-10 p-2 sm:p-4 md:p-6">
                      <div className="w-full aspect-video">
                        <FeaturedVideos />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Floating Audio Player */}
      <FloatingPlayer
        audioSrc="/baiana.mp3"
        trackTitle="Baiana"
        duration={29}
      />

      {/* Schema Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([schemaData, breadcrumbSchema]),
        }}
      />
    </>
  );
}
