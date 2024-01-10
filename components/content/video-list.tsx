import { Video } from "@/types/types";

type VideoListProps = {
  videos: Video[];
  fallbackText: string;
};

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
