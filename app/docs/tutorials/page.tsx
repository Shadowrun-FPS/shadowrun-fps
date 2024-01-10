import Link from "next/link";
import Image from "next/image";
import { DocHero } from "@/components/doc-hero";
import clientPromise from "@/lib/mongodb";
import TutorialVideos from "@/app/tutorial-videos";

export default async function Tutorials() {
  return (
    <div className="flex flex-col items-center justify-center md:flex-row">
      <main
        className="prose place-content-center lg:prose-xl dark:prose-invert"
        style={{ maxWidth: "1600px" }}
      >
        <div className="mt-12 mb-4 text-center text-white">
          <h1 className="mt-12 mb-6 text-3xl font-bold md:text-5xl not-prose">
            Shadowrun Tutorials
          </h1>
        </div>
        <div>
          <TutorialVideos />
        </div>
      </main>
    </div>
  );
}
