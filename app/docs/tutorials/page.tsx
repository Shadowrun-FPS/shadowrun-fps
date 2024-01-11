export const dynamic = "force-dynamic";

import VideoList from "@/components/content/video-list";
import { getTutorialVideos } from "@/components/content/video-list";

export default async function Tutorials() {
  const tutorialVideos = await getTutorialVideos();
  const tutorialCategory = "Tutorial";
  const montageCategory = "Montage";

  const tutorialVideosFiltered = tutorialVideos.filter(
    (video) => video.category === tutorialCategory
  );

  const montageVideosFiltered = tutorialVideos.filter(
    (video) => video.category === montageCategory
  );

  return (
    <div className="flex flex-col items-center justify-center text-center md:flex-row">
      <main
        className="prose text-white place-content-center lg:prose-xl dark:prose-invert"
        style={{ maxWidth: "1600px" }}
      >
        <div>
          <h2 className="mt-12 mb-16 text-3xl font-bold md:text-5xl not-prose">
            Tutorial Videos
          </h2>
          <VideoList
            videos={tutorialVideosFiltered}
            fallbackText="No tutorial videos found."
          />
          <h2 className="mt-12 mb-16 text-3xl font-bold md:text-5xl not-prose">
            Montage Videos
          </h2>
          <VideoList
            videos={montageVideosFiltered}
            fallbackText="No montage videos found."
          />
        </div>
      </main>
    </div>
  );
}
