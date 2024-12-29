import { Button } from "@/components/ui/button";
import FeaturedVideos from "./featured-videos";
import { Download } from "lucide-react";

export default function Home() {
  return (
    <>
      <div className="px-4 py-32 mx-auto bg-center bg-no-repeat bg-cover max-w-screen-2xl bg-hero-image sm:px-6 lg:flex lg:items-center lg:px-8">
        <div className="grid max-w-sm gap-4 ">
          <h1 className="text-3xl font-extrabold text-white">
            Start playing today
          </h1>
          <a
            href="/docs/install"
            // target="_blank"
            rel="noopener noreferrer"
            className="inline-block"
          >
            <Button className="w-full px-6 py-3 text-center">
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </a>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-12 p-12 mx-auto prose max-w-screen-2xl bg-muted dark:prose-invert md:grid-cols-2">
        <p>
          Welcome to the Shadowrun FPS website, &lsquo;This Is Shadowrun&rsquo;.
          We&rsquo;re a fan community dedicated to the preservation of FASA
          Studios&apos; 2007 Shadowrun FPS.
        </p>
      </div>
      <div className="flex flex-col mx-auto" style={{ maxWidth: "1400px" }}>
        <div>
          <div className="mt-12 mb-4 text-3xl font-bold text-center text-white md:text-5xl not-prose">
            <h1>Featured Video</h1>
          </div>

          <FeaturedVideos />
        </div>
      </div>
    </>
  );
}
