import { Button } from "@/components/ui/button";
import FeaturedVideos from "./featured-videos";
import { Download } from "lucide-react";
import Head from "next/head";

export default function Home() {
  return (
    <>
      <Head>
        <title>
          Shadowrun FPS - FASA Studios&apos; 2007 Multiplayer Shooter
        </title>

        <meta
          property="og:title"
          content="Shadowrun FPS - FASA Studios' 2007 Multiplayer Shooter"
        />
        <meta
          property="og:description"
          content="Join the Shadowrun community and download the classic 2007 FPS for PC. Get installation guides, troubleshooting support, and more!"
        />
        <meta property="og:image" content="https://ShadowrunFPS.com/hero.png" />
        <meta property="og:url" content="https://ShadowrunFPS.com" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="Shadowrun FPS - FASA Studios' 2007 Multiplayer Shooter"
        />
        <meta
          name="twitter:description"
          content="Join the Shadowrun community and download the classic 2007 FPS for PC. Get installation guides, troubleshooting support, and more!"
        />
        <meta
          name="twitter:image"
          content="https://ShadowrunFPS.com/hero.png"
        />
        <meta name="twitter:url" content="https://ShadowrunFPS.com" />
      </Head>
      <section className="px-4 py-32 mx-auto bg-center bg-no-repeat bg-cover max-w-screen-2xl bg-hero-image sm:px-6 lg:flex lg:items-center lg:px-8">
        <div className="grid max-w-sm gap-4 ">
          <h1 className="text-4xl font-extrabold text-white">
            Download Shadowrun on PC!
          </h1>
          <p className="text-white">
            Relive FASA Studios&apos; 2007 classic multiplayer shooter.
          </p>
          <a
            href="/docs/install"
            rel="noopener noreferrer"
            className="inline-block"
            aria-label="Download Shadowrun FPS for PC and Xbox 360"
          >
            <Button className="w-full px-6 py-3 text-center">
              <Download className="w-4 h-4 mr-2" />
              Download Shadowrun FPS
            </Button>
          </a>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-12 p-12 mx-auto prose max-w-screen-2xl bg-muted dark:prose-invert md:grid-cols-2">
        <article>
          <h2>About Shadowrun FPS</h2>
          <p>
            Welcome to <strong>This Is Shadowrun</strong>, the ultimate fan site
            for FASA Studios&apos; 2007 Shadowrun FPS on Xbox 360 and PC.
            Explore game guides, join multiplayer sessions, and connect with
            fans keeping the game alive!
          </p>
        </article>
      </section>

      <section className="flex flex-col mx-auto" style={{ maxWidth: "1400px" }}>
        <div>
          <div className="mt-12 mb-4 text-3xl font-bold text-center text-white md:text-5xl not-prose">
            <h2>Featured Shadowrun Videos</h2>
          </div>

          <FeaturedVideos />
        </div>
      </section>

      <script type="application/ld+json">
        {`
{
  "@context": "https://schema.org",
  "@type": "VideoGame",
  "name": "Shadowrun FPS",
  "genre": ["First-Person Shooter", "Multiplayer"],
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://ShadowrunFPS.com/search?q={search_term_string}",
    "query-input": "required name=search_term_string"
  },
  "publisher": {
    "@type": "Organization",
    "name": "FASA Studios"
    "image": "https://ShadowrunFPS.com/shadowrun_invite_banner.png",
"datePublished": "2007-05-29",
  },
  "description": "Shadowrun FPS is a 2007 multiplayer shooter by FASA Studios for Xbox 360 and PC. Join the fan community and keep the game alive!",
  "platform": ["Xbox 360", "PC"],
  "url": "https://ShadowrunFPS.com"
},
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://ShadowrunFPS.com"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Events",
      "item": "https://www.shadowrunfps.com/docs/events"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "Shadowrun PC Install Guide",
      "item": "https://www.shadowrunfps.com/docs/install"
    },
    {
      "@type": "ListItem",
      "position": 4,
      "name": "Shadowrun PC Troubleshooting Guide",
      "item": "https://www.shadowrunfps.com/docs/troubleshoot"
    },
      {
  "@type": "ListItem",
  "position": 5,
  "name": "Join the Discord Community",
  "item": "discord://discord.com/servers/this-is-shadowrun-930362820627943495"
}
  ]
}
`}
      </script>
    </>
  );
}
