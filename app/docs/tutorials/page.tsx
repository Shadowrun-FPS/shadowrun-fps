export const dynamic = "force-dynamic";

import clientPromise from "@/lib/mongodb";
import { Video } from "@/types/types";
import VideoList from "@/components/content/video-list";

export async function getTutorialVideos() {
  const client = await clientPromise;
  const db = client.db("ShadowrunWeb");
  const videos = await db
    .collection<Video>("Videos")
    .find({ isTutorial: "yes" })
    .sort({ featuredOrder: 1 })
    .toArray();
  return videos as Video[];
}

export default async function Tutorials() {
  const tutorialVideos = await getTutorialVideos();
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
          <VideoList
            videos={tutorialVideos}
            fallbackText="No tutorial videos found."
          />
        </div>
      </main>
    </div>
  );
}
