import { hasFeaturedVideo } from "./featured-videos";
import { ChevronDown } from "lucide-react";
import { Metadata } from "next";
import { FloatingPlayer } from "@/components/floating-player";
import DownloadButton from "@/components/download-button";
import { HomeBento } from "@/components/home-bento";
import { HomeAboutSection } from "@/components/home-about-section";
import { HomeBroadcastVideo } from "@/components/home-broadcast-video";
import { HomeSectionHeading } from "@/components/home-section-heading";
import { ScrollReveal } from "@/components/scroll-reveal";

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
      <div className="relative right-1/2 left-1/2 -mx-0 -mt-6 w-screen -translate-x-1/2 sm:-mx-0 md:-mx-0 lg:-mx-0">
        <section className="relative flex flex-col items-center justify-center min-h-[calc(100vh-79px)] sm:min-h-[calc(100vh-89px)] py-12 sm:py-16 md:py-20">
          <div className="absolute inset-0 w-full h-full">
            <div className="absolute inset-0 bg-center bg-cover bg-hero-image md:bg-fixed" />
          </div>

          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/70 to-background" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent opacity-70" />
          <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_0%,rgba(0,0,0,0.8)_100%)]" />

          <div className="relative z-10 flex flex-col gap-24 px-3 mx-auto w-full max-w-7xl text-center sm:px-4 md:px-6 lg:px-8 sm:gap-16">
            <div className="duration-1000 animate-in slide-in-from-top">
              <h1 className="mb-3 sm:mb-4 text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl [text-shadow:_0_4px_24px_rgba(0,0,0,0.5)]">
                <span className="inline-block bg-clip-text">Shadowrun</span>{" "}
                <span className="inline-block text-primary [text-shadow:_0_4px_24px_rgba(var(--primary),0.5)]">
                  FPS
                </span>
              </h1>
              <p className="px-2 mx-auto max-w-3xl text-base sm:text-lg md:text-xl lg:text-2xl text-gray-200 [text-shadow:_0_2px_12px_rgba(0,0,0,0.5)] duration-1000 delay-300 animate-in fade-in sm:px-0">
                Welcome to the community hub for the Shadowrun FPS
              </p>
            </div>

            <div className="flex flex-col gap-2 justify-center items-center duration-1000 delay-300 animate-in fade-in">
              <div className="w-full sm:w-auto">
                <DownloadButton />
              </div>
              <p className="text-sm text-gray-300/90 [text-shadow:_0_1px_8px_rgba(0,0,0,0.5)]">
                Compatible with Windows 10 or newer.
              </p>
            </div>
          </div>

          <a
            href="#getting-started"
            className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-1 rounded text-gray-300/90 transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
            aria-label="Scroll to Getting Started"
          >
            <span className="text-xs font-medium sm:text-sm">
              See how to get started
            </span>
            <ChevronDown className="h-6 w-6 animate-bounce" aria-hidden />
          </a>

          <div
            className="pointer-events-none absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background via-background/70 to-transparent sm:h-44 md:h-52"
            aria-hidden
          />
        </section>
      </div>

      <div className="flex flex-col">
        <section
          id="getting-started"
          className="relative py-14 sm:py-16 md:py-20"
        >
          {/* Soften transition from hero / page bg */}
          <div
            className="pointer-events-none absolute inset-x-0 -top-px z-10 h-20 bg-gradient-to-b from-background to-transparent sm:h-28"
            aria-hidden
          />
          <div className="relative mx-auto max-w-7xl px-3 sm:px-4 md:px-6 lg:px-8">
            <div className="rounded-3xl bg-card/5 p-5 backdrop-blur-sm sm:p-8 md:p-10">
              <HomeBento />
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden py-16 sm:py-20 md:py-24">
          {/* Base tint */}
          <div
            className="pointer-events-none absolute inset-0 bg-muted/10"
            aria-hidden
          />
          {/* Feather into page background — top */}
          <div
            className="pointer-events-none absolute inset-x-0 top-0 z-10 h-32 bg-gradient-to-b from-background via-background/85 to-transparent sm:h-40"
            aria-hidden
          />
          {/* Feather into page background — bottom */}
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-32 bg-gradient-to-t from-background via-background/85 to-transparent sm:h-40"
            aria-hidden
          />
          <div className="relative z-20 px-3 mx-auto max-w-7xl sm:px-4 md:px-6 lg:px-8">
            <HomeAboutSection />
          </div>
        </section>

        {showFeaturedVideo && (
          <section className="relative py-14 sm:py-16 md:py-20">
            <div
              className="pointer-events-none absolute inset-x-0 -top-px z-10 h-16 bg-gradient-to-b from-background to-transparent sm:h-24"
              aria-hidden
            />
            <div className="relative z-20 px-3 mx-auto max-w-7xl sm:px-4 md:px-6 lg:px-8">
              <div className="mx-auto max-w-4xl">
                <ScrollReveal>
                  <HomeSectionHeading>Broadcast</HomeSectionHeading>
                </ScrollReveal>
                <div className="mt-2 sm:mt-4">
                  <HomeBroadcastVideo />
                </div>
              </div>
            </div>
          </section>
        )}
      </div>

      <FloatingPlayer
        audioSrc="/baiana.mp3"
        trackTitle="Baiana"
        duration={29}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([schemaData, breadcrumbSchema]),
        }}
      />
    </>
  );
}
