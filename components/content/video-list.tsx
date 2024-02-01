import { Video } from "@/types/types";
import clientPromise from "@/lib/mongodb";

type VideoListProps = {
  videos: Video[];
  fallbackText: string;
};

export async function getTutorialVideos() {
  const client = await clientPromise;
  const db = client.db("ShadowrunWeb");
  const categoriesToCheck = ["Tutorial", "Montage"];

  const videos = await db
    .collection<Video>("Videos")
    .aggregate([
      { $match: { category: { $in: categoriesToCheck } } },
      {
        $addFields: {
          sortableDate: {
            $dateFromString: {
              dateString: "$datePublished",
              format: "%m-%d-%Y",
            },
          },
        },
      },
      { $sort: { sortableDate: -1 } },
    ])
    .toArray();

  return videos as Video[];
}

export default async function VideoList({
  videos,
  fallbackText,
}: VideoListProps) {
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
              title={video.title}
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
        <p className="text-center">{fallbackText}</p>
      )}
    </div>
  );
}
