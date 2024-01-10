import clientPromise from "@/lib/mongodb";

export type Video = {
  title: string;
  src: string;
  isFeatured: string;
  isTutorial: string;
};

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
export default async function TutorialVideos() {
  const videos = await getTutorialVideos();
  return (
    <div className="grid grid-cols-1 gap-8 mt-8 lg:grid-cols-2 lg:mb-24 lg:mt-0">
      {videos && videos.length > 0 ? (
        videos.map((video, index) => (
          <section key={index} className="relative">
            <iframe
              className="w-full rounded-md aspect-video"
              src={video.src}
              frameBorder="0"
              allowFullScreen
              style={{ width: "100%" }}
            ></iframe>
            <div className="text-center text-white">
              <h2 className="mt-4 mb-8 text-2xl font-bold md:text-4xl not-prose">
                {video.title}
              </h2>
            </div>
          </section>
        ))
      ) : (
        <p className="text-center">No tutorial videos available.</p>
      )}
    </div>
  );
}
