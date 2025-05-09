import { Button } from "@/components/ui/button";
import FeaturedVideos from "./featured-videos";
import { Download } from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";

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

export default function Home() {
  return (
    <>
      {/* Hero Section - Full width with breakout */}
      <div className="relative w-screen -mx-4 -mt-6 -translate-x-1/2 left-1/2 right-1/2">
        <section className="relative flex flex-col items-center justify-center min-h-[60vh] sm:min-h-[70vh] lg:min-h-screen">
          {/* Background with proper full-width positioning */}
          <div className="absolute inset-0 w-full h-full">
            <div className="absolute inset-0 bg-center bg-cover bg-hero-image md:bg-fixed" />
          </div>

          {/* Enhanced gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/70 to-background" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent opacity-70" />
          <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_0%,rgba(0,0,0,0.8)_100%)]" />

          <div className="container relative z-10 px-4 mx-auto text-center">
            {/* Title with enhanced animation */}
            <div className="duration-1000 animate-in slide-in-from-top">
              <h1 className="mb-4 text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl [text-shadow:_0_4px_24px_rgba(0,0,0,0.5)]">
                <span className="inline-block bg-clip-text">Shadowrun</span>{" "}
                <span className="inline-block text-primary [text-shadow:_0_4px_24px_rgba(var(--primary),0.5)]">
                  FPS
                </span>
              </h1>
            </div>

            <div className="max-w-3xl mx-auto space-y-6 duration-1000 delay-300 animate-in fade-in">
              <p className="text-lg text-gray-200 sm:text-xl md:text-2xl [text-shadow:_0_2px_12px_rgba(0,0,0,0.5)]">
                Welcome to the community hub for the Shadowrun FPS
              </p>

              {/* Buttons - made visible on all screen sizes */}
              <div className="flex flex-wrap justify-center gap-4">
                <Link
                  href="/docs/install"
                  className="relative inline-flex items-center px-6 py-3 overflow-hidden text-lg font-medium transition-all rounded-lg group bg-primary hover:bg-primary/90"
                >
                  <span className="relative z-10 flex items-center text-primary-foreground">
                    <Download className="w-5 h-5 mr-2" />
                    Installation Guide
                  </span>
                  <div className="absolute inset-0 transition-transform duration-300 -z-10 bg-gradient-to-r from-primary to-primary/90 group-hover:scale-110" />
                  <div className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
                </Link>

                <Link
                  href="/docs/troubleshoot"
                  className="relative inline-flex items-center px-6 py-3 overflow-hidden text-lg font-medium transition-all rounded-lg group bg-secondary hover:bg-secondary/90"
                >
                  <span className="relative z-10 text-secondary-foreground">
                    Troubleshooting
                  </span>
                  <div className="absolute inset-0 transition-transform duration-300 -z-10 bg-gradient-to-r from-secondary to-secondary/90 group-hover:scale-110" />
                  <div className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
                </Link>
              </div>
            </div>
          </div>

          {/* Enhanced bottom gradient */}
          <div className="absolute bottom-0 w-full h-32 bg-gradient-to-t from-background via-background/90 to-transparent" />
        </section>
      </div>

      {/* Regular page content starts here */}
      <main className="flex flex-col">
        {/* About Section - Enhanced */}
        <section className="relative py-16 overflow-hidden sm:py-24">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-grid-white/5 opacity-20 animate-grid-flow" />
            <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background" />
          </div>

          <div className="container relative px-4 mx-auto">
            <div className="max-w-5xl mx-auto">
              <div className="p-8 transition-all duration-500 rounded-2xl bg-card/30 backdrop-blur-sm hover:bg-card/40 hover:shadow-2xl hover:shadow-primary/5">
                <h2 className="text-3xl font-bold text-center sm:text-4xl lg:text-5xl">
                  <span className="inline-block text-transparent bg-gradient-to-r from-primary via-primary/90 to-primary bg-clip-text animate-gradient">
                    About Shadowrun FPS
                  </span>
                </h2>
                <div className="mt-8 space-y-6">
                  <p className="text-lg text-center sm:text-xl text-muted-foreground">
                    Welcome to{" "}
                    <strong className="text-primary">This Is Shadowrun</strong>,
                    the ultimate fan site for FASA Studios&apos; 2007 Shadowrun
                    FPS.
                  </p>
                  <p className="text-lg text-center sm:text-xl text-muted-foreground">
                    Join our community, explore game guides, and connect with
                    other players keeping the game alive!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Videos Section - Fixed width */}
        <section className="relative py-16 sm:py-24">
          <div className="container relative px-4 mx-auto">
            <div className="max-w-[95%] lg:max-w-5xl mx-auto">
              <div className="relative mb-12 text-center">
                <h2 className="inline-block text-3xl font-bold sm:text-4xl lg:text-5xl">
                  Featured Videos
                  <div className="absolute left-0 right-0 h-px -bottom-4 bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse" />
                </h2>
              </div>
              <div className="relative">
                <div className="absolute w-64 h-64 transition-all duration-1000 rounded-full -top-32 -left-32 bg-primary/5 blur-3xl animate-pulse-slow" />
                <div className="absolute w-64 h-64 transition-all duration-1000 delay-500 rounded-full -bottom-32 -right-32 bg-primary/5 blur-3xl animate-pulse-slow" />

                <div className="relative overflow-hidden rounded-xl bg-card/30 backdrop-blur-sm">
                  <div className="absolute inset-0">
                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/50 to-transparent" />
                  </div>

                  <div className="relative z-10 p-2 sm:p-6">
                    <div className="w-full aspect-video">
                      <FeaturedVideos />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

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
