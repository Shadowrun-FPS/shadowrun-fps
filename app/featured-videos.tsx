import { Video } from "@/types/types";

export async function getFeaturedVideos() {
  return await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/videos?isFeatured=yes`,
    {
      next: { revalidate: 300 },
    }
  )
    .then((res) => res.json())
    .then((data) => {
      return data.results as Video[];
    })
    .catch((error) => {
      console.error("Error fetching video list: ", error);
    });
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
              title={video.title || `Featured video ${index + 1}`}
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
