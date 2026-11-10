import { ChevronDown } from "lucide-react";
import { Metadata } from "next";
import { getServerSession } from "next-auth";
import DownloadButton from "@/components/download-button";
import { HomeBento } from "@/components/home-bento";
import { HomeAboutSection } from "@/components/home-about-section";
import { HomeBroadcastVideo } from "@/components/home-broadcast-video";
import { HomeSectionHeading } from "@/components/home-section-heading";
import { ScrollReveal } from "@/components/scroll-reveal";
import { VisibleMount } from "@/components/visible-mount";
import { HomeClientExtras } from "@/components/home/home-client-extras";
import { HomeFloatingPlayer } from "@/components/home/home-floating-player";
import { HeroLogo } from "@/components/home/hero-logo";
import { authOptions } from "@/lib/auth";
import { HERO_BACKGROUND_SRC } from "@/lib/hero-assets";
import { ogImages } from "@/lib/og-images";
import { canManageContent } from "@/lib/security-config";

// ISR: revalidate every 5 minutes as a fallback.
// On-demand revalidation via revalidatePath("/") fires immediately when
// an admin updates the featured broadcast, so stale HTML is rarely served.
export const revalidate = 300;

export const metadata: Metadata = {
  title: {
    absolute: "Shadowrun FPS (2007) — Download and Play on PC",
  },
  alternates: {
    canonical: "/",
  },
  description:
    "Download the free PC launcher for Shadowrun FPS, the 2007 FASA Studios multiplayer shooter for Xbox 360 and Windows.",
  openGraph: {
    title: "Shadowrun FPS (2007) — Download and Play on PC",
    description:
      "Free PC launcher for Shadowrun FPS (2007). Download and play.",
    images: ogImages("home"),
    url: "https://www.shadowrunfps.com",
    siteName: "Shadowrun FPS",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Shadowrun FPS (2007) — Download and Play on PC",
    description:
      "Free PC launcher for Shadowrun FPS (2007). Download and play.",
    images: ogImages("home"),
  },
};

const schemaData = {
  "@context": "https://schema.org",
  "@type": "VideoGame",
  name: "Shadowrun FPS",
  alternateName: "Shadowrun (2007)",
  genre: ["First-person shooter", "Multiplayer"],
  datePublished: "2007-05-29",
  gamePlatform: ["Xbox 360", "PC"],
  publisher: {
    "@type": "Organization",
    name: "FASA Studios",
  },
  description:
    "Shadowrun FPS is the 2007 multiplayer shooter by FASA Studios for Xbox 360 and Windows. It is not Shadowrun Returns, Dragonfall, or Hong Kong. The fan community keeps it playable on PC with a free launcher.",
  url: "https://www.shadowrunfps.com",
  image: "https://www.shadowrunfps.com/og/home.jpg",
};

export default async function Home() {
  const session = await getServerSession(authOptions);
  const canEditBroadcast = canManageContent(session?.user);

  return (
    <>
      {/*
        Explicitly preload the hero background image so the browser's preload
        scanner discovers it immediately — CSS background-image is invisible
        to it otherwise, which delays LCP on mobile.
      */}
      <link
        rel="preload"
        as="image"
        href={HERO_BACKGROUND_SRC}
        type="image/webp"
        fetchPriority="high"
      />
      <div className="relative right-1/2 left-1/2 -mx-0 -mt-6 w-screen -translate-x-1/2 sm:-mx-0 md:-mx-0 lg:-mx-0">
        <section className="relative flex flex-col items-center justify-center min-h-[calc(100vh-79px)] sm:min-h-[calc(100vh-89px)] py-12 sm:py-16 md:py-20">
          <div className="absolute inset-0 w-full h-full">
            <div
              className="absolute inset-0 bg-center bg-cover md:bg-fixed"
              style={{ backgroundImage: `url('${HERO_BACKGROUND_SRC}')` }}
            />
          </div>

          {/* Light scrim: keeps the background art visible while text stays readable */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/25 to-background" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-black/35 via-transparent to-transparent" />

          <div className="relative z-10 flex flex-col gap-24 px-3 mx-auto w-full max-w-7xl text-center sm:px-4 md:px-6 lg:px-8 sm:gap-16">
            <div>
              <h1 className="sr-only">Shadowrun FPS (2007)</h1>
              <HeroLogo />
            </div>

            <div className="flex flex-col gap-2 justify-center items-center duration-1000 delay-300 animate-in fade-in">
              {/* px-6 mirrors BentoCard horizontal padding so width matches Getting Started on phones */}
              <div className="mx-auto w-full max-w-md px-6 sm:mx-0 sm:w-auto sm:max-w-none sm:px-0">
                <DownloadButton />
              </div>
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
        <section className="relative pt-14 pb-4 sm:pt-16 sm:pb-6 md:pt-20 md:pb-6">
          {/* Soften transition from hero / page bg */}
          <div
            className="pointer-events-none absolute inset-x-0 -top-px z-10 h-20 bg-gradient-to-b from-background to-transparent sm:h-28"
            aria-hidden
          />
          <div className="relative mx-auto max-w-7xl px-3 sm:px-4 md:px-6 lg:px-8">
            <div className="rounded-3xl bg-card/5 pt-6 pb-2 backdrop-blur-sm sm:pt-8 sm:pb-3 md:pt-10 md:pb-4">
              <HomeBento />
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden py-8 sm:py-10 md:py-12">
          {/* Base tint */}
          <div
            className="pointer-events-none absolute inset-0 bg-muted/10"
            aria-hidden
          />
          {/* Feather into page background — top */}
          <div
            className="pointer-events-none absolute inset-x-0 top-0 z-10 h-10 bg-gradient-to-b from-background via-background/85 to-transparent sm:h-12"
            aria-hidden
          />
          {/* Feather into page background — bottom */}
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-10 bg-gradient-to-t from-background via-background/85 to-transparent sm:h-12"
            aria-hidden
          />
          <div className="relative z-20 px-3 mx-auto max-w-7xl sm:px-4 md:px-6 lg:px-8">
            <HomeAboutSection />
          </div>
        </section>

        <section
          id="broadcast"
          className="relative pt-4 pb-14 sm:pt-6 sm:pb-16 md:pt-6 md:pb-20"
        >
          <div
            className="pointer-events-none absolute inset-x-0 -top-px z-10 h-8 bg-gradient-to-b from-background to-transparent sm:h-10"
            aria-hidden
          />
          <div className="relative z-20 px-3 mx-auto max-w-7xl sm:px-4 md:px-6 lg:px-8">
            <div className="mx-auto max-w-4xl">
              <ScrollReveal>
                <div className="mb-8 flex flex-col items-center gap-1.5 text-center sm:mb-10">
                  <HomeSectionHeading className="mb-0 w-full">
                    Broadcast
                  </HomeSectionHeading>
                  <HomeClientExtras canEditBroadcast={canEditBroadcast} />
                </div>
              </ScrollReveal>
              <div className="mt-2 sm:mt-4">
                <VisibleMount
                  rootMargin="600px 0px"
                  fallback={
                    <div className="overflow-hidden rounded-2xl bg-[hsl(220_16%_8%)] shadow-xl shadow-black/25">
                      <div className="flex flex-col gap-3 bg-gradient-to-r from-[hsl(220_20%_12%)] to-[hsl(220_16%_10%)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                        <div className="flex min-w-0 items-center gap-3">
                          <div
                            className="h-10 w-10 shrink-0 rounded-lg bg-primary/12"
                            aria-hidden
                          />
                          <div className="min-w-0">
                            <div className="h-4 w-40 rounded bg-white/10" />
                            <div className="mt-2 h-3 w-24 rounded bg-white/10" />
                          </div>
                        </div>
                        <div className="h-9 w-28 rounded-lg bg-white/10" />
                      </div>
                      <div className="relative aspect-video w-full bg-black">
                        <div
                          className="absolute inset-0 animate-pulse bg-white/5"
                          aria-hidden
                        />
                      </div>
                    </div>
                  }
                >
                  <HomeBroadcastVideo />
                </VisibleMount>
              </div>
            </div>
          </div>
        </section>
      </div>

      <HomeFloatingPlayer />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
            __html: JSON.stringify(schemaData),
        }}
      />
    </>
  );
}
