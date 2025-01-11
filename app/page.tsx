import { Button } from "@/components/ui/button";
import FeaturedVideos from "./featured-videos";
import { Download } from "lucide-react";

export default function Home() {
  return (
    <>
      <section className="px-4 py-32 mx-auto bg-center bg-no-repeat bg-cover max-w-screen-2xl bg-hero-image sm:px-6 lg:flex lg:items-center lg:px-8">
        <div className="grid max-w-sm gap-4 ">
          <h1 className="text-4xl font-extrabold text-white">
            Download Shadowrun on PC!
          </h1>
          <p className="text-white">
            Relive FASA Studios&quot; 2007 classic multiplayer shooter.
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
            for FASA Studios&quot; 2007 Shadowrun FPS on Xbox 360 and PC. Explore
            game guides, join multiplayer sessions, and connect with fans
            keeping the game alive!
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
          "publisher": {
            "@type": "Organization",
            "name": "FASA Studios"
          },
          "description": "Shadowrun FPS is a 2007 multiplayer shooter by FASA Studios for Xbox 360 and PC. Join the fan community and keep the game alive!",
          "platform": ["Xbox 360", "PC"],
          "url": "https://ShadowrunFPS.com"
        }
        `}
      </script>
    </>
  );
}
