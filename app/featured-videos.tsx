import clientPromise from "@/lib/mongodb";

export type Video = {
  title: string;
  src: string;
  isFeatured: string;
  isTutorial: string;
};

export async function getFeaturedVideos() {
  const client = await clientPromise;
  const db = client.db("ShadowrunWeb");
  const videos = await db
    .collection("Videos")
    .find({ isFeatured: "yes" })
    .toArray();
  return videos as unknown as Video[];
}

export default async function FeaturedVideos() {
  const videos = await getFeaturedVideos();
  return (
    <div>
      {videos && videos.length > 0 ? (
        videos.map((video, index) => (
          <section key={index} className="relative mx-4 md:mx-8">
            <iframe
              className="rounded-md aspect-video"
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
        <p className="text-center">No featured videos available.</p>
      )}
    </div>
  );
}
